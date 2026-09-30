const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const User = require('../../../model/user');
const AlbumAssignment = require('../../../model/album-assignment');

const toUserModel = toModelFactory(User);
const toAlbumAssignmentModel = toModelFactory(AlbumAssignment);

module.exports = {
  insert({ userId, albumId }) {
    try {
      return DB.prepare(
        'INSERT INTO album_assignment (user_id, album_id) VALUES (@userId, @albumId)'
      ).run({ userId, albumId }).lastInsertRowid;
    } catch (e) {
      // Ignore duplicate entries
      return null;
    }
  },
  delete({ userId, albumId }) {
    return DB.prepare(
      'DELETE FROM album_assignment WHERE user_id = @userId AND album_id = @albumId'
    ).run({ userId, albumId }).changes;
  },
  findUsersByAlbumId(albumId) {
    return DB.prepare(
      'SELECT u.id, u.name FROM user u INNER JOIN album_assignment aa ON u.id = aa.user_id WHERE aa.album_id = ?'
    )
      .all(albumId)
      .map((u) => toUserModel(u));
  },
  findAll() {
    return DB.prepare('SELECT * from album_assignment').all().map((aa) => toAlbumAssignmentModel(aa));
  },
  findByUserId(userId) {
    return DB.prepare('SELECT * from album_assignment WHERE user_id = ?').all(userId).map((aa) => toAlbumAssignmentModel(aa));
  },
  isAssigned(userId, albumId) {
    const result = DB.prepare(
      'SELECT 1 FROM album_assignment WHERE user_id = ? AND album_id = ?'
    ).get(userId, albumId);
    return !!result;
  },
};
