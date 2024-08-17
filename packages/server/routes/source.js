const dayjs = require('dayjs');
const express = require('express');

const AuthController = require('../controllers/auth');
const SourceService = require('../services/source');
const { SourceDAO } = require('../services/db');
const { requiredParams } = require('../util/route-utils');

const router = express.Router();

router.get('/sources', AuthController.authAdmin, (req, res) => {
  res.send(SourceDAO.findAll());
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

module.exports = router;
