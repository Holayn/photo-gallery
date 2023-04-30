const Database = require("better-sqlite3");
const fs = require("fs-extra");
const path = require("path");

const logger = require("../logger");
const DbSourceMetadata = require("../model/db-source-metadata");

const SOURCE_INDEX_DB_FILENAME = "index.db";
const FILES_TABLE_NAME = "files";

const SIZE_COLUMNS = {
  LARGE: "processed_path_large",
  ORIGINAL: "processed_path_original",
  SMALL: "processed_path_small",
  THUMB: "processed_path_thumb",
};

const connections = {};

/**
 * photo-web-processor DB schema
 */
class DbSource {
  constructor({ path: sourcePath }) {
    this.path = sourcePath;

    if (sourcePath) {
      if (!connections[sourcePath]) {
        logger.info(`Opening DB source: ${sourcePath}`);
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
      const split = r.path.split("/");
      const directories = split.slice(0, split.length - 1);
      paths.add(directories.join("/"));
    });
    return [...paths];
  }

  findFilesFrom(start, num, date, directory) {
    return this.db
      .prepare(
        `
        SELECT * FROM ${FILES_TABLE_NAME} 
        WHERE 
        processed != 0 
        ${directory ? `AND path LIKE '${directory}%'` : ""} 
        ${date ? `AND date < ${date}` : ""} 
        ORDER BY date DESC LIMIT ?, ?
      `
      )
      .all(start, num)
      .map((f) => new DbSourceFile(f));
  }

  /**
   *
   * @returns { Array } { path: string; timestamp: number; metadata: string; date: number; processed: number; }
   */
  getAllFiles() {
    return this.db.prepare(`SELECT * FROM ${FILES_TABLE_NAME}`).all();
  }

  getFile(id) {
    const fileRecord = this.db
      .prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE path = ?`)
      .get(id);
    return new DbSourceFile(fileRecord);
  }

  async getFileData(id, size) {
    const fileRecord = this.db
      .prepare(`SELECT * FROM ${FILES_TABLE_NAME} WHERE path = ?`)
      .get(id);
    const pathColumn = SIZE_COLUMNS[size.toUpperCase()];
    if (!pathColumn) {
      throw new Error("Invalid size");
    }
    if (!fileRecord) {
      throw new Error(`${id} does not exist in DB source ${this.path}.`);
    }
    const sourcePath = fileRecord[pathColumn];
    if (!sourcePath) {
      throw new Error(`${pathColumn} does not exist for ${id}`);
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
}

class DbSourceFile {
  constructor({ path: dbSourceFilePath, date, metadata, sourceId }) {
    this.path = dbSourceFilePath;
    this.date = date;
    this.metadata = new DbSourceMetadata(JSON.parse(metadata));
    this.sourceId = sourceId;
  }
}

module.exports = DbSource;
