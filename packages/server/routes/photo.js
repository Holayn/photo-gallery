const express = require('express');
const path = require('path');
const send = require('send');

const SourceService = require('../services/source');
const AuthController = require('../controllers/auth');
const logger = require('../services/logger');
const { asyncHandler, requiredParams } = require('../util/route-utils');

require('dotenv').config();

if (process.env.ENV !== 'development' && !process.env.FILES_PATH) {
  throw new Error('FILES_PATH needs to be configured in the .env file.');
}

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
      sendFile(path, req, res);
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
      sendFile(p, req, res);
    } else {
      res.sendStatus(404);
    }
  })
);

function sendFile(filePath, req, res) {
  if (process.env.ENV !== 'development' && !process.env.DISABLE_NGINX_REDIRECT) {
    if (filePath.startsWith(process.env.FILES_PATH)) {
      filePath = filePath.substring(`${process.env.FILES_PATH}/`.length);
      logger.info(`X-Accel-Redirect: /files/${filePath}`);
      res.setHeader('X-Accel-Redirect', `/files/${filePath}`);
      res.end();
    } else {
      throw new Error(`File path (${filePath}) is not under FILES_PATH (${process.env.FILES_PATH}).`);
    }
  } else {
    send(req, filePath)
      .on('error', (error) => {
        logger.error(`Error streaming file: ${filePath}`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error streaming file' });
        }
      })
      .pipe(res);
  }
}

module.exports = router;
