const Source = require('../model/source');
const DbSourceMetadata = require('../model/db-source-metadata');
const DB = require('./db');
const DbSource = require('./db-source');
const File = require('../model/file');
const FileService = require('./file');
const logger = require('./logger');

class SourceService {
  constructor() {
    DB.exec('CREATE TABLE IF NOT EXISTS source (id INTEGER PRIMARY KEY, path STRING, alias STRING)');
  }

  /**
   * 
   * @param {String} source 
   * @param {String} alias
   * @returns {String} message
   */
   addSource(sourcePath, alias) {
    return DB.transaction(async () => {
      const insertSourceStmt = DB.prepare('INSERT INTO source (path, alias) VALUES (@path, @alias)');
      const selectSourceStmt = DB.prepare('SELECT * FROM source WHERE path = @path OR alias = @alias');
  
      const existingSource = selectSourceStmt.get({
        alias,
        path: sourcePath,
      });
  
      if (!existingSource) {
        const { lastInsertRowid } = insertSourceStmt.run({
          alias,
          path: sourcePath,
        });
        const sourceRecord = DB.prepare('SELECT * FROM source WHERE rowid = ?').get(lastInsertRowid);
        const dbSource = new DbSource(sourceRecord);
        const dbSourceFiles = await dbSource.getAllFiles();
        dbSourceFiles
          .filter(dsf => dsf.processed)
          .forEach(dsf => {
            FileService.addFile(new File({
              date: dsf.date,
              metadata: new DbSourceMetadata(JSON.parse(dsf.metadata)),
              sourceFileId: dsf.path,
              sourceId: sourceRecord.id,
            }));
          });

        logger.info(`${alias} added with source path: ${sourcePath}.`);
      } else {
        logger.error(`Path (${sourcePath}) or alias (${alias}) already exists.`);
      }
    })();
  }

  async syncSource(alias, forceUpdate) {
    logger.info(`Syncing ${alias}...`);
    const sourceRecord = DB.prepare('SELECT * FROM source WHERE alias = ?').get(alias);
    if (sourceRecord) {
      const dbSource = new DbSource(sourceRecord);
      const dbSourceFiles = await dbSource.getAllFiles();

      const filesToAdd = [];
      const filesToUpdate = [];
      const filesToDelete = DB.prepare('SELECT * FROM file WHERE source_id = ?').all(dbSource.id).reduce((acc, val) => {
        acc[val.id] = val;
        return acc;
      }, {});

      dbSourceFiles
      .filter(dsf => dsf.processed)
      .forEach(dsf => {
        const fileRecord = DB.prepare('SELECT * FROM file WHERE source_file_id = @sourceFileId AND source_id = @sourceId').get({
          sourceFileId: dsf.path,
          sourceId: sourceRecord.id,
        });

        if (!fileRecord) {
          filesToAdd.push(new File({
            date: dsf.date,
            metadata: new DbSourceMetadata(JSON.parse(dsf.metadata)),
            sourceFileId: dsf.path,
            sourceId: sourceRecord.id,
          }));
        }
        else {
          delete filesToDelete[fileRecord.id];

          if (forceUpdate) {
            filesToUpdate.push(dsf);
          }
        }
      });

      if (filesToUpdate.length) {
        logger.info(`Updating ${filesToUpdate.length} files from ${alias}`);
        filesToUpdate.forEach(dsf => {
          DB.prepare('UPDATE file SET metadata = ?, date = ? WHERE source_file_id = ?').run(JSON.stringify(new DbSourceMetadata(JSON.parse(dsf.metadata))), dsf.date, dsf.path);
        });
      } else {
        logger.info(`No files to update from ${alias}`);
      }

      if (filesToAdd.length || Object.keys(filesToDelete).length) {
        logger.info(`Adding ${filesToAdd.length} files, deleting ${Object.keys(filesToDelete).length} files from ${alias}`);
      }

      filesToAdd.forEach(file => {
        // TODO: log to file
        FileService.addFile(file);
      });

      Object.keys(filesToDelete).forEach(id => {
        DB.prepare('DELETE FROM file WHERE id = ?').run(id);
      });

      logger.info(`${alias} synced.`);
    } else {
      logger.error(`Source with alias ${alias} does not exist.`);
    }
  }

  syncSources() {
    DB.prepare('SELECT * FROM source').all().forEach(source => {
      this.syncSource(source.alias);
    });
  }

  deleteSource(alias) {
    const source = DB.prepare('SELECT * FROM source WHERE alias = ?').get(alias);
    if (source) {
      DB.prepare('DELETE FROM file WHERE source_id = ?').run(source.id);
      DB.prepare('DELETE FROM source WHERE id = ?').run(source.id);

      logger.info(`Source ${alias} deleted.`);
    } else {
      logger.error(`Failed to delete ${alias}.`);
    }
  }

  getSource(id) {
    const sourceRecord = DB.prepare('SELECT * FROM source WHERE id = ?').get(id);
    return SourceService.dbRecordToFile(sourceRecord);
  }

  static dbRecordToFile(dbRecord) {
    return new Source({
      ...dbRecord,
    });
  }
}

module.exports = new SourceService();