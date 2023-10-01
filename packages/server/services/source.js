const DbSource = require("./db-source");
const logger = require("../logger");

const Source = require("../model/source");
const File = require("../model/file");
const FileMetadata = require("../metadata/file-metadata");

module.exports = {
  /**
   *
   * @param {String} source
   * @param {String} alias
   * @returns {String} message
   */
  addSource(sourcePath, alias) {
    const existingSource = Source.getSourceByPathOrAlias(sourcePath, alias);

    if (!existingSource) {
      Source.insert(sourcePath, alias);
      logger.info(`${alias} added with source path: ${sourcePath}.`);
    } else {
      logger.error(`Path (${sourcePath}) or alias (${alias}) already exists.`);
    }
  },

  async syncSource(alias) {
    logger.info(`Syncing ${alias}...`);
    const source = Source.getSourceByAlias(alias);
    if (source) {
      const stats = {
        updated: 0,
      };

      // Get all files from this source.
      const files = File.findBySourceId(source.id);

      // Then update its info using info from the DbSource.
      const dbSource = new DbSource(source);

      files.forEach((f) => {
        const dbSourceFile = dbSource.getFile(f.sourceFileId);
        if (dbSourceFile) {
          let diff = false;

          if (f.date !== dbSourceFile.date) {
            diff = true;
          }

          if (diff) {
            File.update({
              ...f,
              date: dbSourceFile.date,
            });
            stats.updated += 1;
            logger.info(`Updating file #${f.id} (${f.sourceFileId}).`);
          }
        }
      });

      logger.info(`${alias} synced - ${stats.updated} files updated.`);
    } else {
      logger.error(`Source with alias ${alias} does not exist.`);
    }
  },

  deleteSource() {
    console.log("Not implemented");
  },

  getSource(sourceId) {
    return Source.get(sourceId);
  },

  findAll() {
    return Source.findAll();
  },

  findFilesFrom(sourceId, start, num, startDateRange, directory) {
    const source = Source.get(sourceId);
    if (source.type === "local") {
      const dbSource = new DbSource(source);
      const dbSourceFiles = dbSource.findFilesFrom(
        start,
        num,
        startDateRange,
        directory
      );
      return dbSourceFiles.map(({ id, date, metadata }) => ({
        date,
        sourceFileId: id,
        metadata: new FileMetadata(metadata),
      }));
    }

    throw new Error("Unexpected source type");
  },

  getSourceFile(sourceId, sourceFileId) {
    const source = Source.get(sourceId);
    if (source.type === "local") {
      const dbSource = new DbSource(source);
      const dbSourceFile = dbSource.getFile(sourceFileId);
      if (dbSourceFile) {
        return {
          date: dbSourceFile.date,
          sourceFileId,
          metadata: new FileMetadata(dbSourceFile.metadata),
        };
      } else { 
        return null;
      }
    }

    throw new Error("Unexpected source type");
  },

  getSourceFileData(sourceId, id, size) {
    const source = Source.get(sourceId);
    if (source.type === "local") {
      const dbSource = new DbSource(source);
      return dbSource.getFileData(id, size);
    }

    throw new Error("Unexpected source type");
  },

  getDirectories(sourceId) {
    const source = Source.get(sourceId);
    if (source.type === "local") {
      const dbSource = new DbSource(source);
      return dbSource.getDirectories();
    }

    throw new Error("Unexpected source type");
  },
};
