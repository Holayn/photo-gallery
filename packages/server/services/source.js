const ProcessorSource = require('./processor-source/processor-source');
const logger = require('./logger');
require('dotenv').config();

const { SourceDAO, GalleryFileDAO, AlbumFileDAO, transaction, AlbumDAO } = require('./db');
const Source = require('../model/source');

const PHOTO_SIZES = ['large', 'small', 'thumb', 'original'];

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
    const source = SourceDAO.getById(sourceId);
    if (source) {
      const processorSource = new ProcessorSource(source);
      const sourceFiles = processorSource.findFiles(startDateRange, directory);
      return setFileAlbums(sourceId, sourceFiles.map(({ id, date, metadata, createdAt }) => ({
        date,
        metadata,
        sourceFileId: id,
        urls: generateSourceFileUrls(sourceId, id),
        createdAt,
      })));
    }

    return [];
  },

  findCoverFiles(sourceId) {
    const source = new ProcessorSource(SourceDAO.getById(sourceId));
    const sourceFiles = source.findRandom(4);
    return sourceFiles.map(({ id, date, metadata }) => ({
      date,
      metadata,
      sourceFileId: id,
      sourceId,
      urls: generateSourceFileUrls(sourceId, id),
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
        sourceId,
        sourceFileId,
        urls: generateSourceFileUrls(sourceId, sourceFileId),
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

function setFileAlbums(sourceId, sourceFiles) {
  const galleryFiles = GalleryFileDAO.findBySourceFileIds(sourceId, sourceFiles.map(f => f.sourceFileId));
  const albumFiles = AlbumFileDAO.findByFileIds(galleryFiles.map(f => f.id));

  // Get album info
  const albums = {};
  const albumIds = new Set();
  albumFiles.forEach(af => {
    albumIds.add(af.albumId);
  });
  albumIds.forEach(albumId => {
    const album = AlbumDAO.getById(albumId);
    albums[albumId] = {
      name: album.name,
      idAlias: album.idAlias,
    };
  });

  // Map fileId to albumId for better lookup.
  const fileIdToAlbum = {};
  albumFiles.forEach(af => {
    if (!fileIdToAlbum[af.fileId]) {
      fileIdToAlbum[af.fileId] = [];
    }
    fileIdToAlbum[af.fileId].push(albums[af.albumId]);
  });

  // Map source file ids to albums
  const sourceFileIdToAlbums = {};
  galleryFiles.forEach(gf => {
    if (fileIdToAlbum[gf.id]) {
      sourceFileIdToAlbums[gf.sourceFileId] = {
        sourceFileId: gf.sourceFileId,
        fileId: gf.id,
        albums: fileIdToAlbum[gf.id]
      }
      albumIds.add(...fileIdToAlbum[gf.id]);
    }
  });

  return sourceFiles.map(sf => ({
    ...sf,
    albums: sourceFileIdToAlbums[sf.sourceFileId]?.albums ?? [],
  }));
}

function generateSourceFileUrls(sourceId, sourceFileId) {
  return {
    view: PHOTO_SIZES.reduce((acc, size) => {
      if (sourceId && sourceFileId) {
        acc[size] = `${process.env.BASE_URL || ''}/api/photo?sourceId=${sourceId}&sourceFileId=${sourceFileId}&size=${size}`;
      } else {
        acc[size] = null;
      }
      return acc;
    }, {}),
    download: (sourceId && sourceFileId) ? `${process.env.BASE_URL || ''}/api/photo/download?sourceId=${sourceId}&sourceFileId=${sourceFileId}` : null,
  }
}