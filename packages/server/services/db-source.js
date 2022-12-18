const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');

const logger = require('../logger');
const DbSourceMetadata = require('../model/db-source-metadata');

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
  constructor({ path: sourcePath }) {
    this.path = sourcePath;

    if (sourcePath) {
      logger.info(`Opening DB source: ${sourcePath}`);
      const sourceIndexDb = new Database(path.resolve(sourcePath, SOURCE_INDEX_DB_FILENAME));
      this.db = sourceIndexDb;
    }
  }

  findFilesFrom(start, num) {
    return this.db.prepare(`
      SELECT * FROM ${FILES_TABLE_NAME} 
      WHERE 
        processed_path_large NOT NULL AND
        processed_path_small NOT NULL AND
        processed_path_original NOT NULL
      ORDER BY date DESC LIMIT ?, ?
    `).all(start, num).map(f => new DbSourceFile(f));
  }

  /**
   * 
   * @returns { Array } { path: string; timestamp: number; metadata: string; date: number; processed: number; }
   */
  getAllFiles() {
    return this.db.prepare(`SELECT * FROM ${FILES_TABLE_NAME}`).all();
  }

  getFile(id) {
    const fileRecord = this.db.prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE path = ?`).get(id);
    return new DbSourceFile(fileRecord);
  }

  getFileData(id, size) {
    const fileRecord = this.db.prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE path = ?`).get(id);
    const pathColumn = SIZE_COLUMNS[size.toUpperCase()];
    if (!pathColumn) {
      throw new Error('Invalid size');
    }
    if (!fileRecord) {
      throw new Error(`${id} does not exist in DB source ${this.path}.`);
    }
    const sourcePath = fileRecord[pathColumn];
    if (!sourcePath) {
      throw new Error(`${pathColumn} does not exist for ${id}`);
    }
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

class DbSourceFile {
  constructor({ path, date, metadata, sourceId }) {
    this.path = path;
    this.date = date;
    this.metadata = new DbSourceMetadata(JSON.parse(metadata));
    this.sourceId = sourceId;
  }
}

module.exports = DbSource;