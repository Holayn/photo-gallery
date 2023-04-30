const Database = require("better-sqlite3");
const fs = require("fs-extra");
const path = require("path");

const DB_FILENAME = "photo-gallery.db";
const DB_PATH = path.resolve(__dirname, `../${DB_FILENAME}`);

class DB {
  constructor() {
    fs.mkdirpSync(path.dirname(DB_PATH));
    this.db = new Database(DB_PATH);
  }
}

module.exports = new DB().db;
