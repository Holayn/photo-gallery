const ProcessorSource = require('./processor-source/processor-source');
const logger = require('./logger');

const { SourceDAO, GalleryFileDAO } = require('./db');
const Source = require('../model/source');

const RANGE_QUERY_SIZE = 50;

module.exports = {
  addSource(sourcePath, alias) {
    const existingSource = SourceDAO.getSourceByPathOrAlias(sourcePath, alias);

    if (!existingSource) {
      SourceDAO.insert(new Source({ alias, path: sourcePath }));
      logger.info(`${alias} added with source path: ${sourcePath}.`);
    } else {
      logger.error(`Path (${sourcePath}) or alias (${alias}) already exists.`);
    }
  },

  async syncSource(alias) {
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
  },

  findFiles(sourceId, start, num, startDateRange, directory) {
    const source = new ProcessorSource(SourceDAO.getById(sourceId));
    const sourceFiles = source.findFiles(start, num, startDateRange, directory);
    return sourceFiles.map(({ id, date, metadata }) => ({
      date,
      metadata,
      sourceFileId: id,
    }));
  },

  getFile(sourceId, sourceFileId) {
    const processorSource = new ProcessorSource(SourceDAO.getById(sourceId));
    const { date, metadata } = processorSource.getFile(sourceFileId);

    if (sourceFile) {
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

  getDirectories(sourceId) {
    return new ProcessorSource(SourceDAO.getById(sourceId)).getDirectories();
  },

  getSourceFilesCoveringArea(
    sourceId,
    start,
    imagePreviewHeight,
    imagePreviewArea,
    startDateRange,
    directory
  ) {
    if (!imagePreviewArea || !imagePreviewHeight) {
      return null;
    }
  
    let usedArea = 0;
    const retFiles = [];
    let rangeStart = start;
    let hasMorePhotos = false;
  
    while (usedArea < imagePreviewArea) {
      const files = this.findFiles(
        sourceId,
        rangeStart,
        RANGE_QUERY_SIZE,
        startDateRange,
        directory
      );
  
      for (const file of files) {
        retFiles.push(file);
  
        const { width: fileWidth, height: fileHeight } = file.metadata;
  
        if (!fileWidth || !fileHeight) {
          throw new Error('File is missing width/height metadata.');
        }
  
        const ratioFactor = fileHeight / imagePreviewHeight;
        const adjustedWidth = fileWidth / ratioFactor;
        usedArea += adjustedWidth * imagePreviewHeight;
  
        if (usedArea >= imagePreviewArea) {
          break;
        }
      }
  
      rangeStart += RANGE_QUERY_SIZE;
  
      hasMorePhotos = files.length >= RANGE_QUERY_SIZE;
  
      if (!hasMorePhotos) {
        break;
      }
    }
  
    return {
      info: {
        hasMorePhotos,
      },
      files: retFiles.map(({ date, sourceFileId = null, metadata }) => ({
        date,
        sourceFileId,
        metadata,
      })),
    };
  }
};
