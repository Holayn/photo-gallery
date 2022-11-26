const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');

const SOURCE_INDEX_DB_FILENAME = 'index.db';
const FILES_TABLE_NAME = 'files';

const SIZE_COLUMNS = {
  LARGE: 'processed_path_large',
  ORIGINAL: 'processed_path_original',
  SMALL: 'processed_path_small',
  THUMB: 'processed_path_thumb',
}

/**
 * photo-web-processor DB schema
 */
class DbSource {
  constructor(record) {
    Object.assign(this, record);

    if (record.path) {
      const sourceIndexDb = new Database(path.resolve(record.path, SOURCE_INDEX_DB_FILENAME));
      this.db = sourceIndexDb;
    }
  }

  /**
   * 
   * @returns { Array } { path: string; timestamp: number; metadata: string; date: number; processed: number; }
   */
  getAllFiles() {
    return this.db.prepare(`SELECT * FROM ${FILES_TABLE_NAME}`).all();
  }

  getFile(path, size) {
    const fileRecord = this.db.prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE path = ?`).get(path);
    const pathColumn = SIZE_COLUMNS[size.toUpperCase()];
    if (!pathColumn) {
      throw new Error('Invalid size');
    }
    if (!fileRecord) {
      throw new Error(`${path} does not exist in DB source ${this.path}.`);
    }
    const sourcePath = fileRecord[pathColumn];
    return this._getFileData(sourcePath);
  }

  async _getFileData(filePath) {
    const photoPath = path.resolve(this.path, filePath);
    const exists = await fs.pathExists(photoPath);
    if (exists) {
      const data = await fs.readFile(photoPath);
      return {
        data,
        fileType: path.extname(photoPath),
      }
    }
  }
}

module.exports = DbSource;