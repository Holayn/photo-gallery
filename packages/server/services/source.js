const ProcessorSource = require('./processor-source/processor-source');
const logger = require('./logger');

const { SourceDAO, GalleryFileDAO, transaction } = require('./db');
const Source = require('../model/source');

module.exports = {
  addSource(sourcePath, alias) {
    transaction(() => {
      const existingSource = SourceDAO.getSourceByPathOrAlias(
        sourcePath,
        alias
      );

      if (!existingSource) {
        SourceDAO.insert(new Source({ alias, path: sourcePath }));
        logger.info(`${alias} added with source path: ${sourcePath}.`);
      } else {
        logger.error(
          `Path (${sourcePath}) or alias (${alias}) already exists.`
        );
      }
    });
  },

  async syncSource(alias) {
    transaction(() => {
      logger.info(`Syncing ${alias}...`);
      const source = SourceDAO.getSourceByAlias(alias);
      if (source) {
        const stats = {
          updated: 0,
        };

        // Get all files from this source.
        const files = GalleryFileDAO.findBySourceId(source.id);

        // Then update its info using info from the ProcessorSource.
        const processorSource = new ProcessorSource(source);

        files.forEach((f) => {
          const sourceFile = processorSource.getFile(f.sourceFileId);
          if (sourceFile) {
            let diff = false;

            if (f.date !== sourceFile.date) {
              diff = true;
            }

            if (diff) {
              GalleryFileDAO.update({
                ...f,
                date: sourceFile.date,
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
    });
  },

  findFiles(sourceId, startDateRange, directory) {
    const source = new ProcessorSource(SourceDAO.getById(sourceId));
    const sourceFiles = source.findFiles(startDateRange, directory);
    return sourceFiles.map(({ id, date, metadata }) => ({
      date,
      metadata,
      sourceFileId: id,
    }));
  },

  findCoverFiles(sourceId) {
    const source = new ProcessorSource(SourceDAO.getById(sourceId));
    const sourceFiles = source.findRandom(4);
    return sourceFiles.map(({ id, date, metadata }) => ({
      date,
      metadata,
      sourceFileId: id,
      sourceId,
    }));
  },

  getFile(sourceId, sourceFileId) {
    const processorSource = new ProcessorSource(SourceDAO.getById(sourceId));
    const sourceFile = processorSource.getFile(sourceFileId);

    if (sourceFile) {
      const { date, metadata } = sourceFile;
      return {
        date,
        metadata,
        sourceFileId,
      };
    }

    return null;
  },

  getFileData(sourceId, id, size) {
    return new ProcessorSource(SourceDAO.getById(sourceId)).getFileData(
      id,
      size
    );
  },

  getFilePath(sourceId, id) {
    return new ProcessorSource(SourceDAO.getById(sourceId)).getFilePath(id);
  },

  getDirectories(sourceId) {
    return new ProcessorSource(SourceDAO.getById(sourceId)).getDirectories();
  },
};
