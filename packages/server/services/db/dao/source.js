const DB = require('../connection');
const { toModelFactory } = require('../../../util/db-utils');
const Source = require('../../../model/source');

const toSourceModel = toModelFactory(Source);

module.exports = {
  insert({ path: sourcePath, alias, processed = true, filesPath = null }) {
    return DB.prepare(
      'INSERT INTO source (path, alias, processed, files_path) VALUES (@path, @alias, @processed, @filesPath)'
    ).run({ path: sourcePath, alias, processed: processed ? 1 : 0, filesPath }).lastInsertRowid;
  },
  update(source) {
    DB.prepare(
      'UPDATE source SET path = @path, alias = @alias, processed = @processed, files_path = @filesPath, processing = @processing, continuous = @continuous WHERE id = @id'
    ).run({
      ...source,
      processed: source.processed ? 1 : 0,
      processing: source.processing ? 1 : 0,
      continuous: source.continuous ? 1 : 0,
    });
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
