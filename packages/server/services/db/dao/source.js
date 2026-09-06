const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const Source = require('../../../model/source');

const toSourceModel = toModelFactory(Source);

module.exports = {
  insert({ path: sourcePath, alias, processed = true }) {
    return DB.prepare(
      'INSERT INTO source (path, alias, processed) VALUES (@path, @alias, @processed)'
    ).run({ path: sourcePath, alias, processed: processed ? 1 : 0 }).lastInsertRowid;
  },
  update(source) {
    DB.prepare(
      'UPDATE source SET path = @path, alias = @alias, processed = @processed WHERE id = @id'
    ).run({ ...source, processed: source.processed ? 1 : 0 });
  },
  getById(id) {
    return toSourceModel(
      DB.prepare('SELECT * FROM source WHERE id = ?').get(id)
    );
  },
  getSourceByPathOrAlias(sourcePath, alias) {
    return toSourceModel(
      DB.prepare('SELECT * FROM source WHERE path = ? OR alias = ?').get(
        sourcePath,
        alias
      )
    );
  },
  getSourceByAlias(alias) {
    return toSourceModel(
      DB.prepare('SELECT * FROM source WHERE alias = ?').get(alias)
    );
  },
  findAll() {
    return DB.prepare('SELECT * FROM source')
      .all()
      .map((s) => toSourceModel(s));
  },
};
