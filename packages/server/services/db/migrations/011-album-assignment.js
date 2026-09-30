// Records which users an album is assigned to (always including its creator, see
// services/album.js's createAlbum and 012-album-created-by.js). This is not access
// control - it drives listing grouping, the add-to-album picker, per-photo album badges,
// and notification recipients (see services/album.js and services/source.js).
module.exports = {
  up(db) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS album_assignment (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        album_id INTEGER,
        FOREIGN KEY(user_id) REFERENCES user(id),
        FOREIGN KEY(album_id) REFERENCES album(id)
      )
    `);
    db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_album_assignment_unique ON album_assignment(user_id, album_id)');
  },
};
