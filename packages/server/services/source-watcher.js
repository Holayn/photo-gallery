const fs = require('fs');
const chokidar = require('chokidar');

const logger = require('./logger');
const { SourceDAO } = require('./db');
const SourceService = require('./source');
const notify = require('./notify');

// Quiet period after the last file-settle event before triggering file processing.
const DEBOUNCE_MS = 10000;

// How long a file must go without writes (and keep the same size) before it
// counts as done. This is the longest stall in a transfer (e.g. a big video
// over a flaky link) that is tolerated before the file is treated as finished.
const STABILITY_MS = 5000;

const watchers = new Map();
// Per source: files that have been written to but haven't settled yet, each
// mapped to { timer, size } - the pending settle check and the size seen last.
// Every entry always has a live timer, so nothing can stay in here forever
// unless it keeps being written to.
const inTransfer = new Map();
const debounceTimers = new Map();
const inFlight = new Map();
const pendingRetry = new Set();

function closeWatchers(sourceId) {
  const watcher = watchers.get(sourceId);
  if (watcher) {
    watcher.close();
    watchers.delete(sourceId);
  }

  const transferring = inTransfer.get(sourceId);
  if (transferring) {
    transferring.forEach(({ timer }) => clearTimeout(timer));
    transferring.clear();
    inTransfer.delete(sourceId);
  }
}

function triggerProcessing(source) {
  if (inFlight.has(source.id)) {
    // A run (this watcher's own, or a manual "Process Now") is already
    // going - remember to check again once it finishes instead of piling up
    // one attempt per file-settle event.
    pendingRetry.add(source.id);
    return;
  }

  let promise;
  try {
    promise = SourceService.processSource(source.id);
  } catch (err) {
    logger.info(`Skipped auto-processing ${source.alias}: ${err.message}`);
    return;
  }

  inFlight.set(source.id, promise);

  promise
    .catch((err) => {
      logger.error(`Failed to auto-process ${source.alias}`, err);
    })
    .finally(() => {
      inFlight.delete(source.id);

      if (pendingRetry.delete(source.id)) {
        triggerProcessing(source);
      }
    });
}

function scheduleProcessing(source) {
  clearTimeout(debounceTimers.get(source.id));
  debounceTimers.set(
    source.id,
    setTimeout(() => {
      debounceTimers.delete(source.id);

      const transferring = inTransfer.get(source.id);
      if (transferring && transferring.size > 0) {
        // Not rescheduled here: each of these files schedules processing again
        // when it settles (or is removed), so the last one out triggers the run.
        logger.info(`${source.alias}: ${transferring.size} file(s) still transferring, deferring processing: ${[...transferring.keys()].slice(0, 5).join(', ')}`);
        return;
      }

      logger.info(`Detected new files for ${source.alias}, processing...`);
      triggerProcessing(source);
    }, DEBOUNCE_MS)
  );
}

function watchSource(source) {
  if (watchers.has(source.id)) {
    return;
  }

  if (!source.filesPath || !fs.existsSync(source.filesPath)) {
    logger.info(`${source.alias}: no files path to watch, skipping.`);
    return;
  }

  try {
    const transferring = new Map();
    inTransfer.set(source.id, transferring);

    // Puts a file in `transferring` (or keeps it there) and restarts its settle
    // countdown, so it only leaves once writes to it have stopped.
    const trackFile = (filePath, stats) => {
      const entry = transferring.get(filePath);
      if (entry) {
        clearTimeout(entry.timer);
      }

      const size = stats ? stats.size : entry && entry.size;
      transferring.set(filePath, {
        size,
        timer: setTimeout(() => checkSettled(filePath), STABILITY_MS),
      });
    };

    const untrackFile = (filePath) => {
      const entry = transferring.get(filePath);
      if (entry) {
        clearTimeout(entry.timer);
        transferring.delete(filePath);
        scheduleProcessing(source);
      }
    };

    const fileRemoved = (filePath) => {
      untrackFile(filePath);
      scheduleProcessing(source);
    };

    // Runs once a file has gone STABILITY_MS without a write. It settles only if
    // its size also hasn't moved since the last look - otherwise (e.g. writes
    // that didn't produce an event) it's checked again later.
    const checkSettled = async (filePath) => {
      const entry = transferring.get(filePath);
      let stats;
      try {
        stats = await fs.promises.stat(filePath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          logger.error(`${source.alias}: failed to check ${filePath}, treating it as settled`, err);
        }
        untrackFile(filePath);
        return;
      }

      // The file may have been written to (new entry and countdown), removed, or
      // unwatched while stat was in flight - this check is stale, so bail.
      if (transferring.get(filePath) !== entry) {
        return;
      }

      if (stats.size === entry.size) {
        untrackFile(filePath);
        return;
      }

      entry.size = stats.size;

      trackFile(filePath);
    };

    // No awaitWriteFinish: every write is reported the moment it happens, and
    // settling is tracked above instead. ignoreInitial: don't fire for the whole
    // existing library on startup, only for changes from here on.
    const watcher = chokidar.watch(source.filesPath, { ignoreInitial: true });

    watcher.on('add', (filePath, stats) => {
      // Only the empty -> non-empty transition notifies, so a batch of files
      // arriving together (or a stalled file resuming) doesn't send one per file.
      const startedTransfer = transferring.size === 0;
      trackFile(filePath, stats);

      if (startedTransfer) {
        notify(undefined, `Files are being added to ${source.alias}.`);
      }
    });
    watcher.on('change', (filePath, stats) => trackFile(filePath, stats));
    watcher.on('unlink', (filePath) => fileRemoved(filePath));
    watcher.on('unlinkDir', (filePath) => fileRemoved(filePath));
    watcher.on('error', (err) => {
      logger.error(`Watcher error for source ${source.alias}, no longer watching its files path`, err);
      closeWatchers(source.id);
    });

    watchers.set(source.id, watcher);
    logger.info(`Watching ${source.alias}'s files path for continuous updates.`);
  } catch (err) {
    logger.error(`Failed to watch source ${source.alias}'s files path`, err);
    closeWatchers(source.id);
  }
}

function unwatchSource(sourceId) {
  closeWatchers(sourceId);

  clearTimeout(debounceTimers.get(sourceId));
  debounceTimers.delete(sourceId);
  pendingRetry.delete(sourceId);
}

function initSourceWatchers() {
  SourceDAO.findAll()
    .filter((source) => source.continuous)
    .forEach(watchSource);
}

function closeSourceWatchers() {
  [...watchers.keys()].forEach(closeWatchers);

  debounceTimers.forEach((timer) => clearTimeout(timer));
  debounceTimers.clear();
  pendingRetry.clear();
}

process.on('exit', closeSourceWatchers);
process.on('SIGINT', () => {
  closeSourceWatchers();
  process.exit(0);
});
process.on('SIGTERM', () => {
  closeSourceWatchers();
  process.exit(0);
});

module.exports = {
  initSourceWatchers,
  watchSource,
  unwatchSource,
};
