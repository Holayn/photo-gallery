const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');

const logger = require('../logger');
const ProcessorSourceFile = require('./processor-source-file');
const { toModelFactory } = require('../../util/db-utils');

const SOURCE_INDEX_DB_FILENAME = 'index.db';
const FILES_TABLE_NAME = 'files';
const SOURCE_FILE_PATH_PREFIX = 'media';
const SIZE_LARGE = 'large';
const SIZE_SMALL = 'small';
const SIZE_THUMB = 'thumb';
const SIZE_ORIGINAL = 'original';
const VALID_SIZES = [SIZE_LARGE, SIZE_SMALL, SIZE_THUMB, SIZE_ORIGINAL];
const IMG_EXTS_NEED_CONVERSION = ['.heic'];
const VIDEO_EXTS_NEED_CONVERSION = ['.mov'];
const CONVERTED_DIR = 'converted';
const CONVERTED_IMG_SUFFIX = '__.jpg';
const CONVERTED_VIDEO_SUFFIX = '__.mp4';
const HDR_VIDEO_PREVIEW_SUFFIX = '__.png';
const SDR_VIDEO_PREVIEW_SUFFIX = '__.jpg';
const VIDEO_PREVIEW_SIZES = [SIZE_SMALL, SIZE_THUMB];

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
          path.join(sourcePath, SOURCE_INDEX_DB_FILENAME),
          { readonly: true }
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
      .prepare(`SELECT path FROM ${FILES_TABLE_NAME} WHERE processed != 0`)
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

  findLatest(count) {
    return this.db
    .prepare(
      `SELECT * FROM ${FILES_TABLE_NAME} ORDER BY date DESC LIMIT ${count}`
    )
    .all()
    .map((f) => toModel(f));
  }

  findRandom(count) {
    const files = [];


    for (let i = 0; i < count; i++) {
      files.push(this.db.prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE processed != 0 LIMIT 1 OFFSET ABS(RANDOM()) % (SELECT COUNT(*) FROM ${FILES_TABLE_NAME} WHERE processed != 0);`).get());
    }

    return files.map((f) => toModel(f));
  }

  async getFileData(id, sizeParam) {
    const fileRecord = this.db
      .prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE id = ?`)
      .get(id);

    if (!fileRecord) {
      throw new Error(`ID:${id} does not exist in processor ${this.path}.`);
    }

    const size = sizeParam.toLowerCase();

    if (!VALID_SIZES.includes(size)) {
      throw new Error('Invalid size');
    }

    // Attempt to return the original file's web-converted copy.
    if (size === SIZE_ORIGINAL) {
      const photoPath = path.join(this.path, SOURCE_FILE_PATH_PREFIX, CONVERTED_DIR, fileRecord.path);
      const exists = await fs.pathExists(photoPath);
      if (exists) {
        return {
          path: photoPath,
          fileType: path.extname(photoPath),
        };
      }
    }

    const get = async sourcePath => {
      let photoPath = path.join(this.path, sourcePath);

      const ext = path.extname(sourcePath);
      if (IMG_EXTS_NEED_CONVERSION.includes(ext.toLowerCase())) {
        photoPath += CONVERTED_IMG_SUFFIX;
      } else if (VIDEO_EXTS_NEED_CONVERSION.includes(ext.toLowerCase())) {
        photoPath += CONVERTED_VIDEO_SUFFIX;
      }

      const exists = await fs.pathExists(photoPath);

      if (exists) {
        return {
          path: photoPath,
          fileType: path.extname(photoPath),
        };
      }

      return null;
    };

    const metadata = fileRecord.metadata ? JSON.parse(fileRecord.metadata) : {};
    const video = metadata.File.MIMEType?.includes('video') ?? false;

    if (video) {
      if (VIDEO_PREVIEW_SIZES.includes(size)) {
        const hdr = metadata.WebImg?.HDR ?? false;
        if (hdr) {
          const result = await get(path.join(SOURCE_FILE_PATH_PREFIX, size, fileRecord.path + HDR_VIDEO_PREVIEW_SUFFIX));
          if (result) {
            return result;
          } else {
            // Fallback to SDR preview if HDR preview does not exist.
            return get(path.join(SOURCE_FILE_PATH_PREFIX, size, fileRecord.path + SDR_VIDEO_PREVIEW_SUFFIX));
          }
        } else {
          return get(path.join(SOURCE_FILE_PATH_PREFIX, size, fileRecord.path + SDR_VIDEO_PREVIEW_SUFFIX));
        }
      } else {
        return get(path.join(SOURCE_FILE_PATH_PREFIX, size, fileRecord.path));
      }
      
    } else {
      return get(path.join(SOURCE_FILE_PATH_PREFIX, size, fileRecord.path));
    }
  }

  async getFilePath(id) {
    const fileRecord = this.db
      .prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE id = ?`)
      .get(id);

    if (!fileRecord) {
      throw new Error(`ID:${id} does not exist in processor ${this.path}.`);
    }

    return path.join(this.path, SOURCE_FILE_PATH_PREFIX, SIZE_ORIGINAL, fileRecord.path);
  }
}

module.exports = ProcessorSource;
