const { columnExists } = require('../migration-utils');

// Soft-delete flag for albums, mirroring album_file's hidden column.
// "Deleting" an album just hides it instead of removing the row (and its
// album_file associations), so it disappears from every listing/lookup
// without losing the underlying data.
module.exports = {
  up(db) {
    if (!columnExists(db, 'album', 'hidden')) {
      db.exec('ALTER TABLE album ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0');
    }
  },
};
