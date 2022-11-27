const express = require('express');

const FileService = require('../services/file');
const AlbumService = require('../services/album');

require('dotenv').config();

const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

const DEFAULT_NUM_TO_LOAD = 50;

const router = express.Router();

router.get('/photos', asyncHandler(async (req, res) => {
  const start = parseInt(req.query.start) || 0;
  const num = parseInt(req.query.num) || DEFAULT_NUM_TO_LOAD;
  const files = FileService.findFilesFrom(start, num);
  const hasMorePhotos = files.length >= num;
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

router.get('/albums', asyncHandler(async (req, res) => {
  res.send(AlbumService.findAllAlbums());
}));
router.get('/album', asyncHandler(async (req, res) => {
  const id = req.query.id;
  const start = parseInt(req.query.start) || 0;
  const num = parseInt(req.query.num) || DEFAULT_NUM_TO_LOAD;
  const files = AlbumService.getAlbumFiles(id)
  const paginatedFiles = files.slice(start, start + num);
  const hasMorePhotos = start + num < files.length;
  res.send({
    info: {
      hasMorePhotos,
    },
    photos: paginatedFiles,
  });
}));
router.get('/album/info', asyncHandler(async (req, res) => {
  const id = req.query.id;
  res.send(AlbumService.getAlbum(id));
}));

router.post('/album', asyncHandler(async (req, res) => {
  const name = req.body.name;
  const files = req.body.files;

  if (!name) { throw new Error('Missing parameter: name.'); }
  
  AlbumService.createAlbum(name, files);
  res.sendStatus(200);
}));

module.exports = router;