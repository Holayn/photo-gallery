const express = require('express');
const path = require('path');
const fs = require('fs');

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
      streamFile(req, res, path);
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
      streamFile(req, res, p);
    } else {
      res.sendStatus(404);
    }
  })
);

function streamFile(req, res, filePath) {
  const fileType = path.extname(filePath);

  if (fileType === 'mp4') {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } else {
    fs.createReadStream(filePath).pipe(res);
  }
}

module.exports = router;