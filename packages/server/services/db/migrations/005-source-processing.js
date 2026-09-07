const { columnExists } = require('../migration-utils');

// Flags that a source is currently being (re)processed by webimg, so the app
// can guard against starting a second concurrent run and the frontend can
// show an in-progress indicator without polling webimg itself.
module.exports = {
  up(db) {
    if (!columnExists(db, 'source', 'processing')) {
      db.exec('ALTER TABLE source ADD COLUMN processing INTEGER NOT NULL DEFAULT 0');
    }
  },
};
