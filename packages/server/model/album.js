const DB = require('../services/db');

DB.exec('CREATE TABLE IF NOT EXISTS album (id INTEGER PRIMARY KEY, name TEXT, token TEXT)');

class Album {
  id;
  name;
  token;

  constructor({ id, name, token }) {
    this.id = id;
    this.name = name;
    this.token = token;
  }

  static insert(name, token) {
    const { lastInsertRowid } = DB.prepare(`INSERT INTO album (name, token) VALUES (?, ?)`).run(name, token);
    return lastInsertRowid;
  }

  static findAll() {
    return DB.prepare('SELECT * FROM album').all().map(a => new Album(a));
  }

  static get(id) {
    return new Album(DB.prepare('SELECT * FROM album WHERE id = ?').get(id));
  }

  static getByToken(token) {
    if (!token) throw new Error('Missing token');
    return new Album(DB.prepare('SELECT * FROM album WHERE token = ?').get(token));
  }
}

module.exports = Album;