const { columnExists } = require('../migration-utils');

// Stores the raw, unprocessed photo directory passed as webimg's input for a
// source (already collected by the "Create" flow into config.json, but never
// persisted on the source row itself). Needed so the app can later trigger
// reprocessing without re-collecting or re-deriving that path.
module.exports = {
  up(db) {
    if (!columnExists(db, 'source', 'files_path')) {
      db.exec('ALTER TABLE source ADD COLUMN files_path TEXT');
    }
  },
};
