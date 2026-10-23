const fs = require('fs');
const chokidar = require('chokidar');

const logger = require('./logger');
const { SourceDAO } = require('./db');
const SourceService = require('./source');
const notify = require('./notify');

// Quiet period after the last file-settle event before triggering a
// reprocess, since a batch of new files each fires their own event as they
// individually finish writing (chokidar's awaitWriteFinish only guarantees a
// single file has stopped changing, not that the whole batch has landed).
const DEBOUNCE_MS = 10000;

// How long a file's size must stay unchanged before it counts as done. This is
// the longest stall in a transfer (e.g. a big video over a flaky link) that is
// tolerated before the file is treated as finished.
const STABILITY_MS = 5000;

// Per source: { stable, raw } chokidar watchers. `raw` reports every write the
// moment it happens, `stable` only once a file has stopped changing.
const watchers = new Map();
// Per source: files that have been written to but haven't settled yet.
const inTransfer = new Map();
// Sources with settled changes that haven't been handed to a run yet.
const needsProcessing = new Set();
const debounceTimers = new Map();
const inFlight = new Map();
const pendingRetry = new Set();

function closeWatchers(sourceId) {
  const entry = watchers.get(sourceId);
  if (entry) {
    entry.stable.close();
    entry.raw.close();
    watchers.delete(sourceId);
  }
  inTransfer.delete(sourceId);
  needsProcessing.delete(sourceId);
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
        logger.info(`${source.alias}: ${transferring.size} file(s) still transferring, deferring processing...`);
        return;
      }

      needsProcessing.delete(source.id);
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
    const transferring = new Set();
    inTransfer.set(source.id, transferring);

    // Fires on every write, so a file lands in `transferring` as soon as it
    // starts arriving and stays there for as long as it keeps growing.
    // ignoreInitial: don't fire for the whole existing library on startup, only
    // for changes from here on (same for the watcher below).
    const raw = chokidar.watch(source.filesPath, { ignoreInitial: true });
    raw.on('add', (filePath) => {
      // Only the empty -> non-empty transition notifies, so a batch of files
      // arriving together (or a stalled file resuming) doesn't send one per file.
      const startedTransfer = transferring.size === 0;
      transferring.add(filePath);

      if (startedTransfer) {
        notify(undefined, `Files are being added to ${source.alias}.`);
      }
    });
    raw.on('change', (filePath) => transferring.add(filePath));
    // A file that disappears (temp file renamed or removed mid-transfer) will
    // never settle, so drop it here and let processing proceed. If settled files
    // were waiting on a run that got deferred because of this one, retrigger it:
    // when a file is deleted before its first settle, chokidar cancels the wait
    // without emitting `unlink` on the settled watcher below, so nothing else
    // would.
    raw.on('unlink', (filePath) => {
      transferring.delete(filePath);
      if (needsProcessing.has(source.id)) {
        scheduleProcessing(source);
      }
    });

    // Waits for a file's size to stop changing before reporting it.
    const stable = chokidar.watch(source.filesPath, {
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: STABILITY_MS,
        pollInterval: 1000,
      },
    });
    stable.on('all', (event, filePath) => {
      if (event === 'add' || event === 'change') {
        transferring.delete(filePath);
      }
      needsProcessing.add(source.id);
      scheduleProcessing(source);
    });

    const onError = (err) => {
      logger.error(`Watcher error for source ${source.alias}, no longer watching its files path`, err);
      closeWatchers(source.id);
    };
    raw.on('error', onError);
    stable.on('error', onError);

    watchers.set(source.id, { stable, raw });
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
