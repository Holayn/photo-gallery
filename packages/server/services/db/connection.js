const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');

const { dataDir } = require('../config');

const DB_PATH = path.join(dataDir, 'photo-gallery.db');

fs.mkdirpSync(dataDir);

const DB = new Database(DB_PATH);
DB.pragma('foreign_keys = ON');

module.exports = DB;
