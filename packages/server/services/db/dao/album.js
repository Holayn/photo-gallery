const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const Album = require('../../../model/album');
const { generateRandomString } = require('../../../util/random');

const generateIdAlias = () => generateRandomString(16);
const toAlbumModel = toModelFactory(Album);

module.exports = {
  insert({ name, modifiedDate = new Date().getTime(), createdBy }) {
    const idAlias = generateIdAlias();
    return DB.prepare(
      'INSERT INTO album (id_alias, name, modified_date, created_by) VALUES (@idAlias, @name, @modifiedDate, @createdBy)'
    ).run({ idAlias, name, modifiedDate, createdBy }).lastInsertRowid;
  },
  findAll() {
    return DB.prepare('SELECT * FROM album WHERE hidden = 0')
      .all()
      .map((a) => toAlbumModel(a));
  },
  findRecentlyUpdated(limit = 10) {
    return DB.prepare(
      'SELECT * FROM album WHERE modified_date IS NOT NULL AND hidden = 0 ORDER BY modified_date DESC LIMIT ?'
    )
      .all(limit)
      .map((a) => toAlbumModel(a));
  },
  // Internal lookup by primary key - not filtered by hidden, since it's used
  // by trusted server-side code that already knows which album it wants
  // (e.g. right after inserting/updating one).
  getById(id) {
    return toAlbumModel(DB.prepare('SELECT * FROM album WHERE id = ?').get(id));
  },
  findByIds(ids) {
    if (!ids.length) {
      return [];
    }
    return DB.prepare(`SELECT * FROM album WHERE id IN (${ids.map(() => '?').join(',')})`)
      .all(ids)
      .map((a) => toAlbumModel(a));
  },
  // Public lookup by the id exposed to clients - hidden (i.e. "deleted")
  // albums are unreachable here, same as if the row didn't exist.
  getByIdAlias(idAlias) {
    return toAlbumModel(
      DB.prepare('SELECT * FROM album WHERE id_alias = ? AND hidden = 0').get(idAlias)
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
  hide(id) {
    DB.prepare('UPDATE album SET hidden = 1 WHERE id = ?').run(id);
  },
};
