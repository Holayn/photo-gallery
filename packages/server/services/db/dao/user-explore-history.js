const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const UserExploreHistory = require('../../../model/user-explore-history');

const toUserExploreHistoryModel = toModelFactory(UserExploreHistory);

module.exports = {
  insert({ userId, sourceId, sourceFileId }) {
    return DB.prepare(
      'INSERT INTO user_explore_history (user_id, source_id, source_file_id) VALUES (@userId, @sourceId, @sourceFileId)'
    ).run({ userId, sourceId, sourceFileId }).lastInsertRowid;
  },
  getByUserIdSourceIdFileId(userId, sourceId, sourceFileId) {
    return toUserExploreHistoryModel(DB.prepare(
      'SELECT * FROM user_explore_history WHERE user_id = ? AND source_id = ? AND source_file_id = ?'
    ).get(userId, sourceId, sourceFileId));
  },
  getMostRecent(userId) {
    return toUserExploreHistoryModel(DB.prepare(
      'SELECT * FROM user_explore_history WHERE user_id = ? ORDER BY id DESC LIMIT 1'
    ).get(userId));
  },
  getByUserId(userId) {
    return DB.prepare(
      'SELECT * FROM user_explore_history WHERE user_id = ?'
    ).all(userId).map((u) => toUserExploreHistoryModel(u));
  },
  deleteByUserId(userId) {
    return DB.prepare(
      'DELETE FROM user_explore_history WHERE user_id = ?'
    ).run(userId);
  },
};
