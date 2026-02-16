const dayjs = require('dayjs');
const express = require('express');

const AuthController = require('../controllers/auth');
const SourceService = require('../services/source');
const { SourceDAO, UserSourceDAO, UserDAO } = require('../services/db');
const { requiredParams, requiredBody } = require('../util/route-utils');

const router = express.Router();

router.get('/sources', AuthController.authAdmin, (req, res) => {
  res.send(SourceDAO.findAll().sort((a, b) => b.id - a.id));
});

router.get(
  '/source/info',
  requiredParams(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: sourceId } = req.query;
    res.send(SourceDAO.getById(sourceId));
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

router.get('/source/directories', requiredParams(['id']), (req, res) => {
  const { id: sourceId } = req.query;
  res.send(SourceService.getDirectories(sourceId));
});

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

router.delete(
  '/source/users',
  requiredBody(['sourceId', 'userId']),
  AuthController.authAdmin,
  (req, res) => {
    const { sourceId, userId } = req.body;
    const changes = UserSourceDAO.delete({ userId: parseInt(userId), sourceId: parseInt(sourceId) });
    res.send({ success: changes > 0 });
  }
);

module.exports = router;
