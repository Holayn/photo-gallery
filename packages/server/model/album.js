const DB = require('../services/db');

DB.exec('CREATE TABLE IF NOT EXISTS album (id INTEGER PRIMARY KEY, name TEXT)');

class Album {
  id;
  name;

  constructor({ id, name }) {
    this.id = id;
    this.name = name;
  }

  static insert(name) {
    const { lastInsertRowid } = DB.prepare(`INSERT INTO album (name) VALUES (?)`).run(name);
    return lastInsertRowid;
  }

  static findAll() {
    return DB.prepare('SELECT * FROM album').all().map(a => new Album(a));
  }

  static get(id) {
    return new Album(DB.prepare('SELECT * FROM album WHERE id = ?').get(id));
  }
}

module.exports = Album;