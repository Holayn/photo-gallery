const dayjs = require('dayjs');
const express = require('express');

const AuthController = require('../controllers/auth');
const SourceService = require('../services/source');
const { SourceDAO } = require('../services/db');
const { asyncHandler, requiredParams } = require('../util/route-utils');

const router = express.Router();

router.get(
  '/sources',
  AuthController.authAdmin,
  asyncHandler(async (req, res) => {
    res.send(SourceDAO.findAll());
  })
);
router.get(
  '/source/info',
  requiredParams(['id']),
  AuthController.authAdmin,
  asyncHandler(async (req, res) => {
    const { id } = req.query;
    res.send(SourceDAO.getById(id));
  })
);
router.get(
  '/source/photos',
  requiredParams(['id']),
  AuthController.authAdmin,
  asyncHandler(async (req, res) => {
    const sourceId = parseInt(req.query.id, 10);
    const start = parseInt(req.query.start, 10) || 0;
    const imagePreviewHeight = parseInt(req.query.imagePreviewHeight, 10);
    const imagePreviewArea = parseInt(req.query.imagePreviewArea, 10);
    const directory = req.query.directory || null;
    const date = req.query.date
      ? dayjs(req.query.date, 'YYYY-MM-DD').valueOf()
      : null;

    const data = SourceService.getSourceFilesCoveringArea(
      sourceId,
      start,
      imagePreviewHeight,
      imagePreviewArea,
      date,
      directory
    );
    if (data == null) {
      res.sendStatus(400);
    } else {
      res.send(data);
    }
  })
);
router.get(
  '/source/directories',
  requiredParams(['id']),
  asyncHandler(async (req, res) => {
    const sourceId = parseInt(req.query.id, 10);

    res.send(SourceService.getDirectories(sourceId));
  })
);

module.exports = router;
