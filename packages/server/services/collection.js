const Database = require('better-sqlite3');
const fs = require('fs-extra');
const path = require('path');

const DB_FILENAME = 'photo-gallery.db';
const DB_PATH = path.resolve(__dirname, `../${DB_FILENAME}`);
const SOURCE_INDEX_DB_FILENAME = 'index.db';

class Collection {
  constructor() {
    fs.mkdirpSync(path.dirname(DB_PATH));
    this.db = new Database(DB_PATH);
    this.db.exec('CREATE TABLE IF NOT EXISTS source (id INTEGER PRIMARY KEY, path STRING, alias STRING)');
    this.db.exec('CREATE TABLE IF NOT EXISTS file (id INTEGER PRIMARY KEY, timestamp_added INTEGER, file_timestamp INTEGER, hash STRING, metadata BLOB, source_id INTEGER, processed_path_small TEXT, processed_path_large TEXT, processed_path_original TEXT, FOREIGN KEY(source_id) REFERENCES source(id))');
  }

  /**
   * 
   * @param {String} source 
   * @param {String} alias
   * @returns {String} message
   */
  addSource(sourcePath, alias) {
    return this.db.transaction(() => {
      const insertSourceStmt = this.db.prepare('INSERT INTO source (path, alias) VALUES (@path, @alias)');
      const selectSourceStmt = this.db.prepare('SELECT * FROM source WHERE path = @path OR alias = @alias');
  
      const existingSource = selectSourceStmt.get({
        alias,
        path: sourcePath,
      });
  
      if (!existingSource) {
        const { lastInsertRowid } = insertSourceStmt.run({
          alias,
          path: sourcePath,
        });
  
        const source = this.db.prepare('SELECT * FROM source WHERE rowid = ?').get(lastInsertRowid);
        const sourceId = source.id;
  
        // read in DB in source and add to file table
        const sourceIndexDb = new Database(path.resolve(sourcePath, SOURCE_INDEX_DB_FILENAME));
        const files = sourceIndexDb.prepare('SELECT * FROM files').all();
        files.forEach(f => {
          this.db
            .prepare(`INSERT INTO file (timestamp_added, file_timestamp, hash, metadata, source_id, processed_path_small, processed_path_large, processed_path_original) VALUES (@timestampAdded, @fileTimestamp, @hash, @metadata, @sourceId, @processedSmall, @processedLarge, @processedOriginal)`)
            .run({
              fileTimestamp: f.timestamp,
              hash: generateHash(f),
              metadata: f.metadata,
              processedLarge: f.processed_path_large,
              processedOriginal: f.processed_path_original,
              processedSmall: f.processed_path_small,
              sourceId,
              timestampAdded: new Date().getTime(),
            });
        });

        return `success: added source of path ${sourcePath}, alias ${alias}.`;
      } else {
        return `failed: path (${sourcePath}) or alias (${alias}) already exists.`;
      }
    })();
  }

  syncSource(alias) {
    const source = this.db.prepare('SELECT * FROM source WHERE alias = ?').get(alias);
    if (source) {
      const sourceIndexDb = new Database(path.resolve(source.path, SOURCE_INDEX_DB_FILENAME));

      const sourceFiles = sourceIndexDb.prepare('SELECT * FROM files').all();

      const filesToAdd = [];
      const filesToDelete = this.db.prepare('SELECT * FROM file WHERE source_id = ?').all(source.id).reduce((acc, val) => {
        acc[val.id] = val;
        return acc;
      }, {});

      sourceFiles.forEach(sourceFile => {
        const fileHash = generateHash(sourceFile);
        const file = this.db.prepare('SELECT * FROM file WHERE hash = @fileHash AND source_id = @sourceId').get({
          fileHash,
          sourceId: source.id,
        });

        if (!file) {
          filesToAdd.push(sourceFile);
        }
        else {
          this.db.prepare('UPDATE file SET hash = ?, processed_path_large = ?, processed_path_original = ?, processed_path_small = ? WHERE id = ?').run(fileHash, sourceFile.processed_path_large, sourceFile.processed_path_original,  sourceFile.processed_path_small, file.id);
        }

        delete filesToDelete[file.id];
      });

      filesToAdd.forEach(f => {
        console.log(`Syncing new file: ${f.path}`)
        this.db
          .prepare(`INSERT INTO file (timestamp_added, file_timestamp, hash, metadata, source_id, processed_path_small, processed_path_large, processed_path_original) VALUES (@timestampAdded, @fileTimestamp, @hash, @metadata, @sourceId, @processedSmall, @processedLarge, @processedOriginal)`)
          .run({
            fileTimestamp: f.timestamp,
            hash: generateHash(f),
            metadata: f.metadata,
            processedLarge: f.processed_path_large,
            processedOriginal: f.processed_path_original,
            processedSmall: f.processed_path_small,
            sourceId: source.id,
            timestampAdded: new Date().getTime(),
          });
      });

      Object.keys(filesToDelete).forEach(id => {
        this.db.prepare('DELETE FROM file WHERE id = ?').run(id);
      });

      return `success: ${alias} source synced.`;
    } else {
      return `failed: source alias ${alias} does not exist.`;
    }
  }

  syncSources() {
    this.findAllSources().forEach(source => {
      this.syncSource(source.alias);
    });
  }

  findAllFiles() {
    return this.db.prepare('SELECT * FROM file').all();
  }

  findAllSources() {
    return this.db.prepare('SELECT * FROM source').all();
  }

  getFile(id) {
    return this.db.prepare('SELECT * FROM file WHERE id = ?').get(id);
  }

  getSource(sourceId) {
    return this.db.prepare('SELECT * FROM source WHERE id = ?').get(sourceId);
  }

  getSourceByAlias(alias) {
    return this.db.prepare('SELECT * FROM source WHERE alias = ?').get(alias);
  }
}

function generateHash(sourceFile) {
  if (sourceFile.metadata) {
    // TODO: should extract sourceFile into class.
    const metadata = JSON.parse(sourceFile.metadata);
    if(metadata.File) {
      const propertiesThatMakeFileUnique = [
        sourceFile.timestamp,
        metadata.File.FileName,
        metadata.File.FileSize,
      ];

      const missingProperty = propertiesThatMakeFileUnique.find(p => p === null || p === undefined);

      if (missingProperty) {
        throw new Error(`failed: unable to generate hash for image. missing property: ${missingProperty}`);
      }

      return propertiesThatMakeFileUnique.join('::');
    }
  } 
  
  throw new Error('failed: unable to generate hash for image.');
}

module.exports = Collection;