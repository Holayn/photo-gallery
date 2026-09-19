const { columnExists } = require('../migration-utils');

// Flags that a single file's video conversion was manually kicked off (e.g.
// a large video initially left preview-only) and is either queued behind
// other webimg runs or actively converting, mirroring source.processing.
module.exports = {
  up(db) {
    if (!columnExists(db, 'file', 'processing')) {
      db.exec('ALTER TABLE file ADD COLUMN processing INTEGER NOT NULL DEFAULT 0');
    }
  },
};
