const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const AlbumFile = require('../../../model/album-file');

const toAlbumFileModel = toModelFactory(AlbumFile);

module.exports = {
  insert({ albumId, fileId, createdAt = new Date().getTime() }) {
    return DB.prepare(
      'INSERT INTO album_file (album_id, file_id, created_at, hidden) VALUES (@albumId, @fileId, @createdAt, 0)'
    ).run({ albumId, fileId, createdAt }).lastInsertRowid;
  },
  // Only matches a currently-visible (non-hidden) association - use this to
  // check current album membership (e.g. "is this file in the album").
  getByAlbumIdFileId(albumId, fileId) {
    return toAlbumFileModel(
      DB.prepare(
        'SELECT * FROM album_file WHERE album_id = ? AND file_id = ? AND hidden = 0'
      ).get(albumId, fileId)
    );
  },
  // Matches regardless of hidden state - use this to tell "never added" apart
  // from "previously removed" when deciding whether to insert vs unhide.
  findAnyByAlbumIdFileId(albumId, fileId) {
    return toAlbumFileModel(
      DB.prepare(
        'SELECT * FROM album_file WHERE album_id = ? AND file_id = ?'
      ).get(albumId, fileId)
    );
  },
  findByAlbumId(albumId) {
    return DB.prepare('SELECT * FROM album_file WHERE album_id = ? AND hidden = 0')
      .all(albumId)
      .map((af) => toAlbumFileModel(af));
  },
  findByFileIds(fileIds) {
    if (!fileIds.length) {
      return [];
    }
    return DB.prepare(
      `SELECT * FROM album_file WHERE file_id IN (${fileIds.map(() => '?').join(',')}) AND hidden = 0`
    )
      .all(fileIds)
      .map((af) => toAlbumFileModel(af));
  },
  hide(albumId, fileId) {
    DB.prepare(
      'UPDATE album_file SET hidden = 1 WHERE album_id = ? AND file_id = ?'
    ).run(albumId, fileId);
  },
  unhide(albumId, fileId, createdAt = new Date().getTime()) {
    DB.prepare(
      'UPDATE album_file SET hidden = 0, created_at = @createdAt WHERE album_id = @albumId AND file_id = @fileId'
    ).run({ albumId, fileId, createdAt });
  },
};
