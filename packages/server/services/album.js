const DB = require('./db');
const Album = require('../model/album');
const FileService = require('./file');

DB.exec('CREATE TABLE IF NOT EXISTS album (id INTEGER PRIMARY KEY, name TEXT)');
DB.exec('CREATE TABLE IF NOT EXISTS album_file (id INTEGER PRIMARY KEY, album_id INTEGER, file_id INTEGER, FOREIGN KEY(album_id) REFERENCES album(id), FOREIGN KEY(file_id) REFERENCES file(id))');

module.exports = {
  createAlbum(name, files = []) {
    const { lastInsertRowid: albumId } = DB.prepare(`INSERT INTO album (name) VALUES (?)`).run(name);
    files.forEach(f => {
      DB.prepare(`INSERT INTO album_file (album_id, file_id) VALUES (?, ?)`).run(albumId, f);
    });
  },

  findAllAlbums() {
    return DB.prepare('SELECT * FROM album').all().map(a => new Album(a));
  },

  getAlbum(id) {
    return new Album(DB.prepare('SELECT * FROM album WHERE id = ?').get(id));
  },

  getAlbumFiles(id) {
    const fileIds = DB.prepare('SELECT file_id FROM album_file WHERE album_id = ?').all(id).map(f => f.file_id);
    return FileService.findByFileIds(fileIds);
  },
}