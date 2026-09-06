const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const AlbumFile = require('../../../model/album-file');

const toAlbumFileModel = toModelFactory(AlbumFile);

module.exports = {
  insert({ albumId, fileId, createdAt = new Date().getTime() }) {
    return DB.prepare(
      'INSERT INTO album_file (album_id, file_id, created_at) VALUES (@albumId, @fileId, @createdAt)'
    ).run({ albumId, fileId, createdAt }).lastInsertRowid;
  },
  getByAlbumIdFileId(albumId, fileId) {
    return toAlbumFileModel(
      DB.prepare(
        'SELECT * FROM album_file WHERE album_id = ? AND file_id = ?'
      ).get(albumId, fileId)
    );
  },
  findByAlbumId(albumId) {
    return DB.prepare('SELECT * FROM album_file WHERE album_id = ?')
      .all(albumId)
      .map((af) => toAlbumFileModel(af));
  },
  findByFileIds(fileIds) {
    if (!fileIds.length) {
      return [];
    }
    return DB.prepare(
      `SELECT * FROM album_file WHERE file_id IN (${fileIds.map(() => '?').join(',')})`
    )
      .all(fileIds)
      .map((af) => toAlbumFileModel(af));
  },
  deleteByFileId(fileId) {
    DB.prepare('DELETE FROM album_file WHERE file_id = ?').run(fileId);
  },
};
