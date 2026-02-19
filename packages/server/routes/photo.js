const express = require('express');
const path = require('path');
const send = require('send');

const config = require('../services/config');
const SourceService = require('../services/source');
const AuthController = require('../controllers/auth');
const logger = require('../services/logger');
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
      const safeName = path.basename(p).replace(/[^\w.\-]/g, '_');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${safeName}`
      );
      sendFile(p, req, res);
    } else {
      res.sendStatus(404);
    }
  })
);

function sendFile(filePath, req, res) {
  if (!config.isDevelopment && !config.disableNginxRedirect) {
    const resolvedPath = path.resolve(filePath);
    const resolvedBase = path.resolve(config.filesPath);
    if (resolvedPath.startsWith(resolvedBase + path.sep) || resolvedPath === resolvedBase) {
      const relative = resolvedPath.substring(resolvedBase.length + 1);
      logger.info(`X-Accel-Redirect: /files/${relative} (${req.url})`);
      res.setHeader('X-Accel-Redirect', `/files/${relative}`);
      res.end();
    } else {
      throw new Error(`File path (${resolvedPath}) is not under FILES_PATH (${resolvedBase}).`);
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
