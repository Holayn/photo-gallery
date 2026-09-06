const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const User = require('../../../model/user');
const UserSource = require('../../../model/user-source');

const toUserModel = toModelFactory(User);
const toUserSourceModel = toModelFactory(UserSource);

module.exports = {
  insert({ userId, sourceId }) {
    try {
      return DB.prepare(
        'INSERT INTO user_source (user_id, source_id) VALUES (@userId, @sourceId)'
      ).run({ userId, sourceId }).lastInsertRowid;
    } catch (e) {
      // Ignore duplicate entries
      return null;
    }
  },
  delete({ userId, sourceId }) {
    return DB.prepare(
      'DELETE FROM user_source WHERE user_id = @userId AND source_id = @sourceId'
    ).run({ userId, sourceId }).changes;
  },
  findUsersBySourceId(sourceId) {
    return DB.prepare(
      'SELECT u.id, u.name FROM user u INNER JOIN user_source us ON u.id = us.user_id WHERE us.source_id = ?'
    )
      .all(sourceId)
      .map((u) => toUserModel(u));
  },
  findAll() {
    return DB.prepare('SELECT * from user_source').all().map((us) => toUserSourceModel(us));
  },
  findByUserId(userId) {
    return DB.prepare('SELECT * from user_source WHERE user_id = ?').all(userId).map((us) => toUserSourceModel(us));
  },
  hasAccess(userId, sourceId) {
    const result = DB.prepare(
      'SELECT 1 FROM user_source WHERE user_id = ? AND source_id = ?'
    ).get(userId, sourceId);
    return !!result;
  },
};
