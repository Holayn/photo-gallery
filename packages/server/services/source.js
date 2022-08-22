const Database = require('better-sqlite3');
const path = require('path');

const SOURCE_INDEX_DB_FILENAME = 'index.db';
const FILES_TABLE_NAME = 'files';

class Source {
  constructor(dbRecord) {
    this.dbRecord = dbRecord;
  }

  async getFiles() {
    // TODO: this will fetch from an API.
    const { path: filePath } = this.dbRecord;
    const sourceIndexDb = new Database(path.resolve(filePath, SOURCE_INDEX_DB_FILENAME));
    const files = sourceIndexDb.prepare(`SELECT * FROM ${FILES_TABLE_NAME}`).all();
    return files;
  }
}

module.exports = Source;