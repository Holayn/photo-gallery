const { columnExists } = require('../migration-utils');

// Soft-delete flag for album_file rows. Removing a photo from an album now
// hides the association instead of deleting it, so re-adding the same photo
// later can be told apart from adding it for the first time (needed to only
// fire an album-update push notification on genuinely new additions).
module.exports = {
  up(db) {
    if (!columnExists(db, 'album_file', 'hidden')) {
      db.exec('ALTER TABLE album_file ADD COLUMN hidden INTEGER NOT NULL DEFAULT 0');
    }
  },
};
