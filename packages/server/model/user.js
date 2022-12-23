const DB = require('../services/db');

DB.exec('CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY, name TEXT, password TEXT)');

class User {
  static getByNamePass(name, password) {
    const record = DB.prepare('SELECT * FROM user WHERE name = ? AND password = ?').get(name, password);
    if (record) {
      return new User();
    }
    
    return null;
  }
}

module.exports = User;