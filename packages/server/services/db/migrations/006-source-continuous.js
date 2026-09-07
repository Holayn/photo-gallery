const { columnExists } = require('../migration-utils');

// Opts a source into being watched at its raw files_path so new files
// trigger reprocessing automatically. Off by default - watching every
// source's input directory has real per-source cost (recursive crawl,
// watch-descriptor count scaling with directory depth), unlike the free
// index.db-only watch this replaces, so it's opt-in per source.
module.exports = {
  up(db) {
    if (!columnExists(db, 'source', 'continuous')) {
      db.exec('ALTER TABLE source ADD COLUMN continuous INTEGER NOT NULL DEFAULT 0');
    }
  },
};
