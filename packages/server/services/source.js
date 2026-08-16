const path = require('path');
const fs = require('fs');
const ProcessorSource = require('./processor-source/processor-source');
const logger = require('./logger');
const { baseUrl, filesPath, webImgToolPath } = require('./config');
const { PHOTO_SIZES } = require('../constants/photo');
const { SourceDAO, GalleryFileDAO, AlbumFileDAO, transaction, AlbumDAO } = require('./db');
const Source = require('../model/source');

module.exports = {
  addSource(sourcePath, alias, { processed = true } = {}) {
    return transaction(() => {
      const existingSource = SourceDAO.getSourceByPathOrAlias(
        sourcePath,
        alias
      );

      if (!existingSource) {
        const id = SourceDAO.insert(new Source({ alias, path: sourcePath, processed }));
        logger.info(`${alias} added with source path: ${sourcePath}.`);
        return id;
      } else {
        throw new Error(`Path (${sourcePath}) or alias (${alias}) already exists.`);
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

  createSource({
    sourceFilesPath,
    alias,
    exclude,
  }) {
    if (!fs.existsSync(sourceFilesPath)) {
      throw new Error(`Files with path ${sourceFilesPath} do not exist.`);
    }
    const sourceDirPath = path.join(filesPath, alias);
    fs.mkdirSync(sourceDirPath, { recursive: true });
    const webImgConfigPath = path.join(sourceDirPath, 'config.json');
    const webImgConfig = {
      input: sourceFilesPath,
      output: sourceDirPath,
      exclude,
    };
    fs.writeFileSync(webImgConfigPath, JSON.stringify(webImgConfig, null, 2));
    const id = this.addSource(sourceDirPath, alias, { processed: false });

    const promise = (async () => {
      const { execa } = await import('execa');
      await execa('npm', ['run', 'start', '--', '--config', webImgConfigPath], {
        cwd: webImgToolPath,
        stdio: 'inherit',
      });

      const source = SourceDAO.getById(id);
      source.processed = true;
      SourceDAO.update(source);
    })();

    return { id, promise };
  },

  findFiles(sourceId, startDateRange, directory) {
    const source = SourceDAO.getById(sourceId);
    if (source) {
      const processorSource = new ProcessorSource(source);
      const sourceFiles = processorSource.findFiles(startDateRange, directory);
      return setFileProperties(sourceId, sourceFiles.map(({ id, date, metadata, createdAt }) => ({
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

  getFileCount(sourceId) {
    return new ProcessorSource(SourceDAO.getById(sourceId)).count();
  },

  getFile(sourceId, sourceFileId) {
    const processorSource = new ProcessorSource(SourceDAO.getById(sourceId));
    const sourceFile = processorSource.getFile(sourceFileId);

    if (sourceFile) {
      const { date, metadata } = sourceFile;

      const galleryFile = GalleryFileDAO.getBySource(sourceId, sourceFileId);

      return {
        date,
        metadata,
        sourceId,
        sourceFileId,
        urls: generateSourceFileUrls(sourceId, sourceFileId),
        shareUrl: galleryFile ? galleryFile.token ? `${baseUrl}/api/photo?sourceId=${sourceId}&sourceFileId=${sourceFileId}&size=full&token=${galleryFile.token}` : null : null,
      };
    }

    return null;
  },

  getProcessedFilePath(sourceId, id, size) {
    return new ProcessorSource(SourceDAO.getById(sourceId)).getProcessedFilePath(
      id,
      size
    );
  },

  getOriginalPath(sourceId, id) {
    return new ProcessorSource(SourceDAO.getById(sourceId)).getOriginalPath(id);
  },
};

function setFileProperties(sourceId, sourceFiles) {
  const galleryFiles = GalleryFileDAO.findBySourceFileIds(sourceId, sourceFiles.map(f => f.sourceFileId));
  const albumFiles = AlbumFileDAO.findByFileIds(galleryFiles.map(f => f.id));

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

  const fileIdToAlbum = {};
  albumFiles.forEach(af => {
    if (!fileIdToAlbum[af.fileId]) {
      fileIdToAlbum[af.fileId] = [];
    }
    fileIdToAlbum[af.fileId].push(albums[af.albumId]);
  });

  const sourceFileIdToAlbums = {};
  const sourceFileIdToTokens = {};
  galleryFiles.forEach(gf => {
    if (fileIdToAlbum[gf.id]) {
      sourceFileIdToAlbums[gf.sourceFileId] = {
        sourceFileId: gf.sourceFileId,
        fileId: gf.id,
        albums: fileIdToAlbum[gf.id]
      }
      albumIds.add(...fileIdToAlbum[gf.id]);
    }

    if (gf.token) {
      sourceFileIdToTokens[gf.sourceFileId] = gf.token;
    }
  });

  return sourceFiles.map(sf => ({
    ...sf,
    albums: sourceFileIdToAlbums[sf.sourceFileId]?.albums ?? [],
    shareUrl: sourceFileIdToTokens[sf.sourceFileId] ? `${baseUrl}/api/photo?sourceId=${sourceId}&sourceFileId=${sf.sourceFileId}&size=full&token=${sourceFileIdToTokens[sf.sourceFileId]}` : null,
  }));
}

function generateSourceFileUrls(sourceId, sourceFileId) {
  return {
    view: Object.values(PHOTO_SIZES).reduce((acc, size) => {
      if (sourceId && sourceFileId) {
        acc[size] = `${baseUrl}/api/photo?sourceId=${sourceId}&sourceFileId=${sourceFileId}&size=${size}`;
      } else {
        acc[size] = null;
      }
      return acc;
    }, {}),
    download: (sourceId && sourceFileId) ? `${baseUrl}/api/photo/download?sourceId=${sourceId}&sourceFileId=${sourceFileId}` : null,
  }
}