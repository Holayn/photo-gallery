const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const User = require('../../../model/user');

const toUserModel = toModelFactory(User);

module.exports = {
  getByUsername(username) {
    return toUserModel(
      DB.prepare('SELECT * FROM user WHERE name = ?').get(username)
    );
  },
  getById(id) {
    return toUserModel(
      DB.prepare('SELECT * FROM user WHERE id = ?').get(id)
    );
  },
  findAll() {
    return DB.prepare('SELECT id, name FROM user')
      .all()
      .map((u) => toUserModel(u));
  },
  upsert({ name }) {
    return DB.prepare(
      'INSERT INTO user (name) VALUES (@name) ON CONFLICT(name) DO NOTHING'
    ).run({ name }).lastInsertRowid;
  },
};
