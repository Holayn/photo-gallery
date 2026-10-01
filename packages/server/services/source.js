const path = require('path');
const fs = require('fs');
const ProcessorSource = require('./processor-source/processor-source');
const logger = require('./logger');
const notify = require('./notify');
const PushNotification = require('./push-notification');
const { enqueue } = require('./processing-queue');
const { filesPath, webImgToolPath } = require('./config');
const { SourceDAO, GalleryFileDAO, transaction } = require('./db');
const Source = require('../model/source');

const SKIP_LARGE_VIDEOS_ARG = '--skip-large-videos';

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
      await enqueue(() => execa('npm', ['run', 'start', '--', '--config', webImgConfigPath, SKIP_LARGE_VIDEOS_ARG], {
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

        logger.info(`Started processing ${source.alias}`);

        const { execa } = await import('execa');
        await enqueue(() => execa('npm', ['run', 'start', '--', '--config', webImgConfigPath, SKIP_LARGE_VIDEOS_ARG], {
          cwd: webImgToolPath,
          stdio: 'inherit',
        }));

        logger.info(`Finishing processing ${source.alias}`);

        this.ingestSourceFileIndex(source);
        const fileCountAfter = countIndexedFiles(source.id);

        SourceDAO.touch(source.id);
        notify(undefined, `${source.alias} finished processing.`);

        const addedCount = fileCountAfter - fileCountBefore;
        if (addedCount > 0) {
          PushNotification.notifyAll({
            title: 'New Photos',
            body: `${addedCount} new ${addedCount > 1 ? 'photos were' : 'photo was'} added to ${source.alias}.`,
            url: `/source/${source.id}`,
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

      GalleryFileDAO.findProcessing().forEach((file) => {
      const source = SourceDAO.getById(file.sourceId);
      const webImgConfigPath = source && findConfigPath(source.path);

      if (!webImgConfigPath) {
        logger.error(`File #${file.sourceFileId} was left converting after a restart, but its source/config is missing - skipping...`);
        GalleryFileDAO.setProcessing({ sourceId: file.sourceId, sourceFileId: file.sourceFileId, processing: false });
        return;
      }

      logger.info(`File #${file.sourceFileId} in ${source.alias} was left converting after a restart, resuming...`);
      this.runFileConversion(source, file.sourceFileId, webImgConfigPath).catch((err) => {
        logger.error(`Failed to convert file #${file.sourceFileId} in ${source.alias}`, err);
      });
    });
  },

  convertFile(sourceId, sourceFileId) {
    const source = SourceDAO.getById(sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} does not exist.`);
    }

    const existing = GalleryFileDAO.getBySource(sourceId, sourceFileId);
    if (existing?.processing) {
      throw new Error(`File ${sourceFileId} in ${source.alias} is already converting.`);
    }

    const webImgConfigPath = findConfigPath(source.path);
    if (!webImgConfigPath) {
      throw new Error(`No webimg config file found in ${source.path}.`);
    }

    GalleryFileDAO.setProcessing({ sourceId, sourceFileId, processing: true });
    notify(undefined, `${source.alias}: converting file #${sourceFileId}.`);

    return this.runFileConversion(source, sourceFileId, webImgConfigPath);
  },

  runFileConversion(source, sourceFileId, webImgConfigPath) {
    return (async () => {
      try {
        logger.info(`Converting file #${sourceFileId} in ${source.alias}`);

        const { execa } = await import('execa');
        await enqueue(() => execa('npm', ['run', 'start', '--', 'convert', '--id', String(sourceFileId), '--config', webImgConfigPath], {
          cwd: webImgToolPath,
          stdio: 'inherit',
        }));

        logger.info(`Finished converting file #${sourceFileId} in ${source.alias}`);

        this.ingestSourceFileIndex(source);
        notify(undefined, `${source.alias}: file #${sourceFileId} finished converting.`);
      } catch (err) {
        notify(undefined, `${source.alias}: file #${sourceFileId} failed to convert: ${err.message}`);
        throw err;
      } finally {
        GalleryFileDAO.setProcessing({ sourceId: source.id, sourceFileId, processing: false });
      }
    })();
  },
};
