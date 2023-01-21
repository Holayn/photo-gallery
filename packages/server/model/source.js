const DB = require('../services/db');

DB.exec('CREATE TABLE IF NOT EXISTS source (id INTEGER PRIMARY KEY, path STRING, alias STRING)');

class Source {
  constructor({ id, alias, path }) {
    this.id = id;
    this.alias = alias;
    this.path = path;

    this.type = 'local';
  }

  static insert(path, alias) {
    return DB.prepare('INSERT INTO source (path, alias) VALUES (?, ?)').run(path, alias).lastInsertRowid;
  }

  static get(id) {
    return new Source(DB.prepare('SELECT * FROM source WHERE id = ?').get(id));
  }

  static getSourceByPathOrAlias(path, alias) {
    const record = DB.prepare('SELECT * FROM source WHERE path = ? OR alias = ?').get(path, alias);
    if (record) {
      return new Source(record);
    }
    return null;
  }

  static getSourceByAlias(alias) {
    return new Source(DB.prepare('SELECT * FROM source WHERE alias = ?').get(alias));
  }

  static findAll() {
    return DB.prepare('SELECT * FROM source').all().map(s => new Source(s));
  }
}

module.exports = Source;