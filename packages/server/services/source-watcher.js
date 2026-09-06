const fs = require('fs');

const logger = require('./logger');
const { SourceDAO } = require('./db');
const SourceService = require('./source');
const ProcessorSource = require('./processor-source/processor-source');

// Wait for a quiet period after the last detected change before syncing, since a
// single processor scan can touch index.db several times in quick succession.
const DEBOUNCE_MS = 5000;

const watchers = new Map();
const debounceTimers = new Map();

function scheduleSync(source) {
  clearTimeout(debounceTimers.get(source.id));
  debounceTimers.set(
    source.id,
    setTimeout(() => {
      debounceTimers.delete(source.id);
      logger.info(`Detected an update to ${source.alias}, syncing...`);
      SourceService.syncSource(source.alias).catch((err) => {
        logger.error(`Failed to sync ${source.alias} after detecting an update`, err);
      });
    }, DEBOUNCE_MS)
  );
}

function watchSource(source) {
  if (watchers.has(source.id)) {
    return;
  }

  const indexDbPath = ProcessorSource.getFullDbPath(source.path);
  if (!fs.existsSync(indexDbPath)) {
    return;
  }

  try {
    const watcher = fs.watch(indexDbPath, () => {
      scheduleSync(source);
    });

    watcher.on('error', (err) => {
      logger.error(`Watcher error for source ${source.alias}, no longer watching it for updates`, err);
      watchers.delete(source.id);
    });

    watchers.set(source.id, watcher);
    logger.info(`Watching ${source.alias} for updates.`);
  } catch (err) {
    logger.error(`Failed to watch source ${source.alias} for updates`, err);
  }
}

function initSourceWatchers() {
  SourceDAO.findAll()
    .filter((source) => source.processed)
    .forEach(watchSource);
}

function closeSourceWatchers() {
  watchers.forEach((watcher) => watcher.close());
  watchers.clear();

  debounceTimers.forEach((timer) => clearTimeout(timer));
  debounceTimers.clear();
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
};
