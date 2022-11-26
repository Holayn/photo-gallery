const express = require('express');

const FileService = require('../services/file');

require('dotenv').config();

const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

const DEFAULT_NUM_TO_LOAD = 50;

const router = express.Router();

router.get('/photos', asyncHandler(async (req, res) => {
  const start = req.query.start || 0;
  const num = req.query.num || DEFAULT_NUM_TO_LOAD;
  const files = FileService.findFilesFrom(start, num);
  const hasMorePhotos = files.length >= req.query.num;
  res.send({
    info: {
      hasMorePhotos,
    },
    photos: files,
  });
}));

router.get('/photo', asyncHandler(async (req, res) => {
  const id = req.query.id;
  const size = req.query.size;
  const file = FileService.getFile(id);
  if (file) {
    const fileData = await file.getData(size);
    if (fileData) {
      const { data, fileType } = fileData;
      res.contentType(fileType);
      res.send(data);
    } else {
      res.status(404).send('Photo not found.');
    }
  } else {
    res.status(400).send('Invalid photo id.');
  }
}));

module.exports = router;