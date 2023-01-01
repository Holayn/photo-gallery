const DbSource = require('./db-source');
const logger = require('../logger');

const AlbumFile = require('../model/album-file');
const File = require('../model/file');
const Source = require('../model/source');
const FileMetadata = require('../metadata/file-metadata');

class SourceService {
  /**
   * 
   * @param {String} source 
   * @param {String} alias
   * @returns {String} message
   */
   addSource(sourcePath, alias) {
    const existingSource = Source.getSourceByPathOrAlias(alias, sourcePath);

    if (!existingSource) {
      Source.insert(alias, sourcePath);
      logger.info(`${alias} added with source path: ${sourcePath}.`);
    } else {
      logger.error(`Path (${sourcePath}) or alias (${alias}) already exists.`);
    }
  }

  async syncSource(alias) {
    logger.info(`Syncing ${alias}...`);
    const source = Source.getSourceByAlias(alias);
    if (source) {
      const dbSource = new DbSource(source);
      const dbSourceFiles = await dbSource.getAllFiles();

      const filesToDelete = File.findBySourceId(dbSource.id).reduce((acc, val) => {
        acc[val.id] = val;
        return acc;
      }, {});

      dbSourceFiles
      .filter(dsf => dsf.processed)
      .forEach(dsf => {
        const fileRecord = File.getBySource(source.id, dsf.path);

        if (fileRecord) {
          delete filesToDelete[fileRecord.id];
        }
      });

      if (Object.keys(filesToDelete).length) {
        logger.info(`Deleting ${Object.keys(filesToDelete).length} files from ${alias}`);
      }

      Object.keys(filesToDelete).forEach(id => {
        AlbumFile.deleteByFileId(id);
        File.delete(id);
      });

      logger.info(`${alias} synced.`);
    } else {
      logger.error(`Source with alias ${alias} does not exist.`);
    }
  }

  syncSources() {
    Source.findAll().forEach(source => {
      this.syncSource(source.alias);
    });
  }

  getSource(sourceId) {
    return Source.get(sourceId);
  }

  findAll() {
    return Source.findAll();
  }

  findFilesFrom(sourceId, start, num) {
    const source = Source.get(sourceId);
    if (source.type === 'local') {
      const dbSource = new DbSource(source);
      const dbSourceFiles = dbSource.findFilesFrom(start, num);
      return dbSourceFiles.map(({ date, path, metadata }) => ({
        date,
        sourceId: this.id,
        sourceFileId: path,
        metadata: new FileMetadata(metadata),
      }));
    }
  }

  getSourceFile(sourceId, sourceFileId) {
    const source = Source.get(sourceId);
    if (source.type === 'local') {
      const dbSource = new DbSource(source);
      const dbSourceFile = dbSource.getFile(sourceFileId);
      return {
        date: dbSourceFile.date,
        sourceId,
        sourceFileId,
        metadata: new FileMetadata(dbSourceFile.metadata),
      };
    }
  }

  getSourceFileData(sourceId, id, size) {
    const source = Source.get(sourceId);
    if (source.type === 'local') {
      const dbSource = new DbSource(source);
      return dbSource.getFileData(id, size);
    }
  }
}

module.exports = new SourceService();