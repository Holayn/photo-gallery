const { columnExists } = require('../migration-utils');

// Permanently records who created/owns an album, separate from album_assignment (which
// tracks who an album is assigned to and can change over time - the creator is always
// among them, see services/album.js's createAlbum). Creator wasn't tracked before this
// column existed, so every pre-existing album is backfilled to the first user (id 1) -
// also assigning them via album_assignment, since the rest of the app assumes an
// album's creator is always among its assigned users.
module.exports = {
  up(db) {
    if (!columnExists(db, 'album', 'created_by')) {
      db.exec('ALTER TABLE album ADD COLUMN created_by INTEGER REFERENCES user(id)');
    }

    db.exec('UPDATE album SET created_by = 1 WHERE created_by IS NULL');
    db.exec(`
      INSERT OR IGNORE INTO album_assignment (user_id, album_id)
      SELECT 1, id FROM album WHERE created_by = 1
    `);
  },
};
