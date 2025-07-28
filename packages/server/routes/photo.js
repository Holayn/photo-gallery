const express = require('express');
const path = require('path');

const SourceService = require('../services/source');
const AuthController = require('../controllers/auth');
const { asyncHandler, requiredParams } = require('../util/route-utils');

const router = express.Router();

router.get(
  '/photo',
  requiredParams(['sourceFileId', 'sourceId', 'size']),
  AuthController.authPhoto,
  asyncHandler(async (req, res) => {
    const { sourceFileId, sourceId, size } = req.query;

    const fileData = await SourceService.getFileData(
      sourceId,
      sourceFileId,
      size
    );

    if (fileData) {
      const { path, fileType } = fileData;
      res.contentType(fileType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.sendFile(path);
    } else {
      res.sendStatus(404);
    }
  })
);

router.get(
  '/photo/download',
  requiredParams(['sourceFileId', 'sourceId']),
  AuthController.authPhoto,
  asyncHandler(async (req, res) => {
    const { sourceFileId, sourceId } = req.query;

    const p = await SourceService.getFilePath(sourceId, sourceFileId);

    if (p) {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${path.basename(p)}`
      );
      res.sendFile(p);
    } else {
      res.sendStatus(404);
    }
  })
);

module.exports = router;
