const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');

const logger = require('../logger');
const ProcessorSourceFile = require('./processor-source-file');
const { toModelFactory } = require('../../util/db-utils');

const SOURCE_INDEX_DB_FILENAME = 'index.db';
const FILES_TABLE_NAME = 'files';

const SIZE_COLUMNS = {
  LARGE: 'processed_path_large',
  ORIGINAL: 'processed_path_original',
  SMALL: 'processed_path_small',
  THUMB: 'processed_path_thumb',
};

const connections = {};

const toModel = toModelFactory(ProcessorSourceFile);

/**
 * photo-web-processor DB schema
 */
class ProcessorSource {
  constructor({ path: sourcePath }) {
    this.path = sourcePath;

    if (sourcePath) {
      if (!connections[sourcePath]) {
        logger.info(`Opening photo-web-processor source: ${sourcePath}`);
        const sourceIndexDb = new Database(
          path.resolve(sourcePath, SOURCE_INDEX_DB_FILENAME)
        );
        this.db = sourceIndexDb;
        connections[sourcePath] = sourceIndexDb;
      } else {
        this.db = connections[sourcePath];
      }
    }
  }

  getDirectories() {
    const records = this.db
      .prepare(
        `
        SELECT path FROM ${FILES_TABLE_NAME} 
        WHERE processed != 0
      `
      )
      .all();
    const paths = new Set();
    records.forEach((r) => {
      const split = r.path.split('/');
      const directories = split.slice(0, split.length - 1);
      paths.add(directories.join('/'));
    });
    return [...paths];
  }

  findFiles(date, directory) {
    return this.db
      .prepare(
        `
        SELECT * FROM ${FILES_TABLE_NAME} 
        WHERE processed != 0 
        ${directory ? `AND path LIKE '${directory}%'` : ''} 
        ${date ? `AND date < ${date}` : ''} 
        ORDER BY date DESC
      `
      )
      .all()
      .map((f) => toModel(f));
  }

  getFile(id) {
    return toModel(
      this.db.prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE id = ?`).get(id)
    );
  }

  findFilesMatching(file) {
    return this.db
      .prepare(
        `SELECT * FROM ${FILES_TABLE_NAME} WHERE file_name = ${file.fileName} AND file_date = ${file.fileDate}`
      )
      .all()
      .map((f) => toModel(f));
  }

  async getFileData(id, size) {
    const fileRecord = this.db
      .prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE id = ?`)
      .get(id);

    if (!fileRecord) {
      throw new Error(`ID:${id} does not exist in processor ${this.path}.`);
    }

    const pathColumn = SIZE_COLUMNS[size.toUpperCase()];
    if (!pathColumn) {
      throw new Error('Invalid size');
    }

    const sourcePath = fileRecord[pathColumn];
    if (!sourcePath) {
      throw new Error(`${pathColumn} does not exist for ${id}`);
    }

    // Attempt to return the original file's web-converted copy.
    if (SIZE_COLUMNS[size.toUpperCase()] === SIZE_COLUMNS.ORIGINAL) {
      const largePath = fileRecord[SIZE_COLUMNS.LARGE];
      if (!largePath) {
        throw new Error('Failed to derive path for converted file.');
      }
      const convertedPath = fileRecord[SIZE_COLUMNS.LARGE].replace(
        'large',
        'converted'
      );
      const photoPath = path.resolve(this.path, convertedPath);
      const exists = await fs.pathExists(photoPath);
      if (exists) {
        const data = await fs.readFile(photoPath);
        return {
          data,
          fileType: path.extname(photoPath),
        };
      }
    }

    const photoPath = path.resolve(this.path, sourcePath);
    const exists = await fs.pathExists(photoPath);

    if (exists) {
      const data = await fs.readFile(photoPath);
      return {
        data,
        fileType: path.extname(photoPath),
      };
    }

    return null;
  }

  async getFilePath(id) {
    const fileRecord = this.db
      .prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE id = ?`)
      .get(id);

    if (!fileRecord) {
      throw new Error(`ID:${id} does not exist in processor ${this.path}.`);
    }

    const sourcePath = fileRecord[SIZE_COLUMNS.ORIGINAL];
    if (!sourcePath) {
      throw new Error(`${SIZE_COLUMNS.ORIGINAL} does not exist for ${id}`);
    }

    // Attempt to return the original file's web-converted copy.
    const convertedPath = fileRecord[SIZE_COLUMNS.ORIGINAL].replace(
      'original',
      'converted'
    );
    const photoPath = path.resolve(this.path, convertedPath);
    const exists = await fs.pathExists(photoPath);
    if (exists) {
      return photoPath;
    } else {
      return path.resolve(this.path, fileRecord[SIZE_COLUMNS.ORIGINAL]);
    }
  }
}

module.exports = ProcessorSource;
