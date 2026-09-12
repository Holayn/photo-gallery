const path = require('path');
const fs = require('fs');
const ProcessorSource = require('./processor-source/processor-source');
const logger = require('./logger');
const notify = require('./notify');
const PushNotification = require('./push-notification');
const { enqueue } = require('./processing-queue');
const { baseUrl, filesPath, webImgToolPath } = require('./config');
const { PHOTO_SIZES } = require('../constants/photo');
const { SourceDAO, GalleryFileDAO, AlbumFileDAO, transaction, AlbumDAO } = require('./db');
const Source = require('../model/source');

// A source's webimg config may be named anything as long as it ends with
// "config.json" - find whichever file in the source's directory matches.
function findConfigPath(sourcePath) {
  const configFile = fs.readdirSync(sourcePath).find((file) => file.endsWith('config.json'));
  return configFile ? path.join(sourcePath, configFile) : undefined;
}

function countIndexedFiles(sourceId) {
  return GalleryFileDAO.findBySourceId(sourceId).length;
}

module.exports = {
  addSource(sourcePath, alias, { processed = true, filesPath } = {}) {
    return transaction(() => {
      const existingSource = SourceDAO.getSourceByPathOrAlias(
        sourcePath,
        alias
      );

      if (!existingSource) {
        const id = SourceDAO.insert(new Source({ alias, path: sourcePath, processed, filesPath }));
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

  // Reads a single source's already-produced index.db and upserts its
  // processed files into the centralized file index. Called both by the
  // one-time backfill below and right after the app finishes processing a
  // source, so `file` never depends on anything more than what webimg
  // already wrote out.
  ingestSourceFileIndex(source) {
    if (!fs.existsSync(ProcessorSource.getFullDbPath(source.path))) {
      logger.info(`${source.alias}: no index found, skipping.`);
      return;
    }

    transaction(() => {
      const processorSource = new ProcessorSource(source);
      const files = processorSource.findFiles();

      files.forEach((file) => {
        GalleryFileDAO.upsertFromSource({
          sourceId: source.id,
          sourceFileId: file.id,
          date: file.date,
        });
      });

      logger.info(`${source.alias}: ingested ${files.length} files into the centralized index.`);
    });
  },

  backfillFileIndex() {
    SourceDAO.findAll().forEach((source) => this.ingestSourceFileIndex(source));
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
    const id = this.addSource(sourceDirPath, alias, { processed: false, filesPath: sourceFilesPath });

    const promise = (async () => {
      const { execa } = await import('execa');
      await enqueue(() => execa('npm', ['run', 'start', '--', '--config', webImgConfigPath], {
        cwd: webImgToolPath,
        stdio: 'inherit',
      }));

      const source = SourceDAO.getById(id);
      source.processed = true;
      SourceDAO.update(source);

      this.ingestSourceFileIndex(source);
    })();

    return { id, promise };
  },

  processSource(sourceId) {
    const source = SourceDAO.getById(sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} does not exist.`);
    }
    if (!source.filesPath) {
      throw new Error(`${source.alias} has no files path to reprocess from.`);
    }
    if (source.processing) {
      throw new Error(`${source.alias} is already processing.`);
    }

    const webImgConfigPath = findConfigPath(source.path);
    if (!webImgConfigPath) {
      throw new Error(`No webimg config file found in ${source.path}.`);
    }

    source.processing = true;
    SourceDAO.update(source);
    notify(undefined, `${source.alias} started processing.`);

    return this.runProcessing(source, webImgConfigPath);
  },

  // Runs webimg (queued behind any other in-flight run) and reconciles the
  // centralized index afterward. Assumes `source.processing` is already true
  // and the config path has already been validated - shared by processSource()
  // above and resumeInterruptedProcessing() below, which re-enters here
  // directly for sources a crash/restart left mid-run, without going back
  // through processSource()'s own "already processing" guard.
  runProcessing(source, webImgConfigPath) {
    return (async () => {
      try {
        const fileCountBefore = countIndexedFiles(source.id);

        const { execa } = await import('execa');
        await enqueue(() => execa('npm', ['run', 'start', '--', '--config', webImgConfigPath], {
          cwd: webImgToolPath,
          stdio: 'inherit',
        }));

        this.ingestSourceFileIndex(source);
        const fileCountAfter = countIndexedFiles(source.id);

        SourceDAO.touch(source.id);
        notify(undefined, `${source.alias} finished processing.`);

        const addedCount = fileCountAfter - fileCountBefore;
        if (addedCount > 0) {
          PushNotification.notifyAll({
            title: 'New Photos',
            body: `${addedCount} new ${addedCount > 1 ? 'photos were' : 'photo was'} added to ${source.alias}.`,
          }).catch((err) => logger.error(`Failed to send push notification for source #${source.id}`, err));
        }
      } catch (err) {
        notify(undefined, `${source.alias} failed to process: ${err.message}`);
        throw err;
      } finally {
        source.processing = false;
        SourceDAO.update(source);
      }
    })();
  },

  // Called once at server startup. A source left with processing=true has no
  // actual webimg process behind it anymore - the process that was running
  // it is gone - so without this it would stay stuck "processing" forever.
  // Re-enqueues each one to actually finish the job.
  resumeInterruptedProcessing() {
    SourceDAO.findAll()
      .filter((source) => source.processing)
      .forEach((source) => {
        const webImgConfigPath = findConfigPath(source.path);

        if (!webImgConfigPath) {
          logger.error(`${source.alias} was left processing after a restart, but its config is missing - skipping...`);
          source.processing = false;
          SourceDAO.update(source);
          return;
        }

        logger.info(`${source.alias} was left processing after a restart, resuming...`);
        this.runProcessing(source, webImgConfigPath).catch((err) => {
          logger.error(`Failed to process source ${source.alias}`, err);
        });
      });
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