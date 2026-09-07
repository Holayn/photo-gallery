const fs = require('fs');
const chokidar = require('chokidar');

const logger = require('./logger');
const { SourceDAO } = require('./db');
const SourceService = require('./source');

// Quiet period after the last file-settle event before triggering a
// reprocess, since a batch of new files each fires their own event as they
// individually finish writing (chokidar's awaitWriteFinish only guarantees a
// single file has stopped changing, not that the whole batch has landed).
const DEBOUNCE_MS = 10000;

const watchers = new Map();
const debounceTimers = new Map();
const inFlight = new Map();
const pendingRetry = new Set();

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
    const watcher = chokidar.watch(source.filesPath, {
      // Don't fire for the whole existing library on startup, only for
      // changes from here on.
      ignoreInitial: true,
      // Wait for a file's size to stop changing before reporting it, so a
      // still-transferring/partially-written file doesn't trigger a run.
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 500,
      },
    });

    watcher.on('all', () => scheduleProcessing(source));

    watcher.on('error', (err) => {
      logger.error(`Watcher error for source ${source.alias}, no longer watching its files path`, err);
      watchers.delete(source.id);
    });

    watchers.set(source.id, watcher);
    logger.info(`Watching ${source.alias}'s files path for continuous updates.`);
  } catch (err) {
    logger.error(`Failed to watch source ${source.alias}'s files path`, err);
  }
}

function unwatchSource(sourceId) {
  const watcher = watchers.get(sourceId);
  if (watcher) {
    watcher.close();
    watchers.delete(sourceId);
  }

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
  watchers.forEach((watcher) => watcher.close());
  watchers.clear();

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
