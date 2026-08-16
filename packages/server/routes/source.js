const { EventEmitter } = require('events');
const dayjs = require('dayjs');
const express = require('express');

const AuthController = require('../controllers/auth');
const SourceService = require('../services/source');
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
      }))
  );
});

router.get(
  '/source/info',
  requiredParams(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: sourceId } = req.query;
    const { id, alias, processed } = SourceDAO.getById(sourceId);
    res.send({ id, alias, processed });
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
