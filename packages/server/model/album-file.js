const DB = require("../services/db");

DB.exec(
  "CREATE TABLE IF NOT EXISTS album_file (id INTEGER PRIMARY KEY, album_id INTEGER, file_id INTEGER, FOREIGN KEY(album_id) REFERENCES album(id), FOREIGN KEY(file_id) REFERENCES file(id))"
);

class AlbumFile {
  static insert(albumId, fileId) {
    return DB.prepare(
      `INSERT INTO album_file (album_id, file_id) VALUES (?, ?)`
    ).run(albumId, fileId).lastInsertRowid;
  }

  static getByAlbumIdFileId(albumId, fileId) {
    return DB.prepare(
      "SELECT * FROM album_file WHERE album_id = ? AND file_id = ?"
    ).get(albumId, fileId);
  }

  static findByAlbumId(albumId) {
    return DB.prepare("SELECT file_id FROM album_file WHERE album_id = ?").all(
      albumId
    );
  }

  static deleteByFileId(fileId) {
    DB.prepare("DELETE FROM album_file WHERE file_id = ?").run(fileId);
  }
}

module.exports = AlbumFile;
