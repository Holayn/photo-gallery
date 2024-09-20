const express = require('express');
const axios = require('axios');
const path = require('path');

const SourceService = require('../services/source');
const AuthController = require('../controllers/auth');
const { asyncHandler, requiredParams } = require('../util/route-utils');

const router = express.Router();

require('dotenv').config();

if (!process.env.POSITIONSTACK_APIKEY) {
  console.warn('Warning: no PositionStack API key set.');
}

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
      const { data, fileType } = fileData;
      res.contentType(fileType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(data);
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

router.get(
  '/location',
  requiredParams(['lat', 'long']),
  asyncHandler(async (req, res) => {
    if (!process.env.POSITIONSTACK_APIKEY) {
      res.sendStatus(503);
      return;
    }

    const { lat, long } = req.query;
    try {
      const { data } = await axios(
        `http://api.positionstack.com/v1/reverse?access_key=${process.env.POSITIONSTACK_APIKEY}&query=${lat},${long}`
      );
      if (data) {
        const [result] = data.data;
        res.send(result);
      } else {
        res.sendStatus(503);
      }
    } catch (e) {
      res.sendStatus(400);
    }
  })
);

module.exports = router;
