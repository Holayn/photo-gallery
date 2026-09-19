const { EventEmitter } = require('events');
const dayjs = require('dayjs');
const express = require('express');

const AuthController = require('../controllers/auth');
const SourceService = require('../services/source');
const SourceWatcher = require('../services/source-watcher');
const logger = require('../services/logger');
const { SourceDAO, UserSourceDAO, UserDAO } = require('../services/db');
const { requiredParams, requiredBody } = require('../util/route-utils');

const router = express.Router();

// In-memory registry of in-flight/completed createSource jobs, keyed by source id.
const createSourceJobs = new Map();

router.get('/sources', AuthController.authAdmin, (req, res) => {
  res.send(
    SourceDAO.findAll()
      .sort((a, b) => b.id - a.id)
      .map((source) => ({
        ...source,
        fileCount: source.processed ? SourceService.getFileCount(source.id) : 0,
        users: UserSourceDAO.findUsersBySourceId(source.id),
      }))
  );
});

router.get(
  '/source/info',
  requiredParams(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: sourceId } = req.query;
    const { id, alias, processed, processing, continuous, filesPath } = SourceDAO.getById(sourceId);
    res.send({ id, alias, processed, processing, continuous, filesPath });
  }
);

// Cheap polling endpoint for processing status only - no ProcessorSource
// connections opened, unlike /sources which also computes fileCount per
// source. Safe to poll frequently regardless of source count.
router.get('/sources/processing', AuthController.authAdmin, (req, res) => {
  res.send(
    SourceDAO.findAll().map(({ id, processing }) => ({ id, processing }))
  );
});

router.post(
  '/source/continuous',
  requiredBody(['id', 'continuous']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: sourceId, continuous } = req.body;

    const source = SourceDAO.getById(sourceId);
    if (!source) {
      res.sendStatus(400);
      return;
    }

    if (continuous && !source.filesPath) {
      res.status(400).send({ message: `${source.alias} has no files path to watch.` });
      return;
    }

    source.continuous = !!continuous;
    SourceDAO.update(source);

    if (source.continuous) {
      SourceWatcher.watchSource(source);
    } else {
      SourceWatcher.unwatchSource(source.id);
    }

    res.sendStatus(200);
  }
);

router.post(
  '/source/process',
  requiredBody(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: sourceId } = req.body;

    let promise;
    try {
      promise = SourceService.processSource(sourceId);
    } catch (err) {
      res.status(400).send({ message: err.message });
      return;
    }

    promise.catch((err) => {
      logger.error(`Failed to process source ${sourceId}`, err);
    });

    res.sendStatus(202);
  }
);

router.post(
  '/source/file/convert',
  requiredBody(['sourceId', 'sourceFileId']),
  AuthController.authAdmin,
  (req, res) => {
    const { sourceId, sourceFileId } = req.body;

    let promise;
    try {
      promise = SourceService.convertFile(sourceId, sourceFileId);
    } catch (err) {
      res.status(400).send({ message: err.message });
      return;
    }

    promise.catch((err) => {
      logger.error(`Failed to convert file ${sourceFileId} in source ${sourceId}`, err);
    });

    res.sendStatus(202);
  }
);

router.post(
  '/source/files/status',
  requiredBody(['files']),
  AuthController.authAdmin,
  (req, res) => {
    const { files } = req.body;
    res.send(SourceService.getFilesStatus(files));
  }
);

router.get(
  '/source/photos',
  requiredParams(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: sourceId, date = null, directory = null } = req.query;

    const files = SourceService.findFiles(
      sourceId,
      date ? dayjs(date, 'YYYY-MM-DD').valueOf() : null,
      directory
    );
    if (!files) {
      res.sendStatus(400);
    } else {
      res.send({
        files,
      });
    }
  }
);

router.get(
  '/source/cover',
  requiredParams(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: sourceId } = req.query;

    const files = SourceService.findCoverFiles(sourceId);
    if (!files) {
      res.sendStatus(400);
    } else {
      res.send({
        files,
      });
    }
  }
);

router.get('/users', AuthController.authAdmin, (req, res) => {
  res.send(UserDAO.findAll());
});

router.get(
  '/source/users',
  requiredParams(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: sourceId } = req.query;
    const users = UserSourceDAO.findUsersBySourceId(sourceId);
    res.send(users);
  }
);

router.post(
  '/source/users',
  requiredBody(['sourceId', 'userId']),
  AuthController.authAdmin,
  (req, res) => {
    const { sourceId, userId } = req.body;
    const result = UserSourceDAO.insert({ userId: parseInt(userId), sourceId: parseInt(sourceId) });
    if (result) {
      res.send({ success: true, id: result });
    } else {
      res.send({ success: false, message: 'Association already exists or failed' });
    }
  }
);

router.post(
  '/source/users/delete',
  requiredBody(['sourceId', 'userId']),
  AuthController.authAdmin,
  (req, res) => {
    const { sourceId, userId } = req.body;
    const changes = UserSourceDAO.delete({ userId: parseInt(userId), sourceId: parseInt(sourceId) });
    res.send({ success: changes > 0 });
  }
);

router.post(
  '/source/create',
  requiredBody(['sourceFilesPath', 'alias']),
  AuthController.authAdmin,
  (req, res) => {
    const { sourceFilesPath, alias, exclude } = req.body;

    let id, promise;
    try {
      ({ id, promise } = SourceService.createSource({ sourceFilesPath, alias, exclude }));
    } catch (err) {
      res.status(400).send({ message: err.message });
      return;
    }

    const job = { status: 'pending', result: null, emitter: new EventEmitter() };
    createSourceJobs.set(String(id), job);

    promise
      .then(() => {
        job.status = 'done';
        job.result = { success: true };
        job.emitter.emit('done', job.result);
      })
      .catch((err) => {
        job.status = 'done';
        job.result = { success: false, message: err.message };
        job.emitter.emit('done', job.result);
      });

    res.send({ id });
  }
);

router.get(
  '/source/create/stream',
  requiredParams(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id } = req.query;
    const job = createSourceJobs.get(String(id));

    if (!job) {
      res.sendStatus(404);
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    const sendDone = (result) => {
      res.write(`event: done\ndata: ${JSON.stringify(result)}\n\n`);
      res.end();
      createSourceJobs.delete(id);
    };

    if (job.status === 'done') {
      sendDone(job.result);
      return;
    }

    job.emitter.once('done', sendDone);
    req.on('close', () => {
      job.emitter.removeListener('done', sendDone);
    });
  }
);

module.exports = router;
