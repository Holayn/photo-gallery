const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const Album = require('../../../model/album');
const { generateRandomString } = require('../../../util/random');

const generateIdAlias = () => generateRandomString(16);
const toAlbumModel = toModelFactory(Album);

module.exports = {
  insert({ name, modifiedDate = new Date().getTime() }) {
    const idAlias = generateIdAlias();
    return DB.prepare(
      'INSERT INTO album (id_alias, name, modified_date) VALUES (@idAlias, @name, @modifiedDate)'
    ).run({ idAlias, name, modifiedDate }).lastInsertRowid;
  },
  findAll() {
    return DB.prepare('SELECT * FROM album')
      .all()
      .map((a) => toAlbumModel(a));
  },
  findRecentlyUpdated(limit = 10) {
    return DB.prepare(
      'SELECT * FROM album WHERE modified_date IS NOT NULL ORDER BY modified_date DESC LIMIT ?'
    )
      .all(limit)
      .map((a) => toAlbumModel(a));
  },
  getById(id) {
    return toAlbumModel(DB.prepare('SELECT * FROM album WHERE id = ?').get(id));
  },
  getByIdAlias(idAlias) {
    return toAlbumModel(
      DB.prepare('SELECT * FROM album WHERE id_alias = ?').get(idAlias)
    );
  },
  update({ id, name, token }) {
    DB.prepare(
      'UPDATE album SET name = @name, token = @token WHERE id = @id'
    ).run({ id, name, token });
  },
  touch(id, modifiedDate = new Date().getTime()) {
    DB.prepare(
      'UPDATE album SET modified_date = @modifiedDate WHERE id = @id'
    ).run({ id, modifiedDate });
  },
};
