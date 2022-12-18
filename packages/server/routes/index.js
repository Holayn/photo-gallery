const express = require('express');

const AlbumService = require('../services/album');
const SourceService = require('../services/source');

require('dotenv').config();

const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

const missingParam = (res, parameterName) => { res.status(400).send(`Missing parameter: ${parameterName}`); }

const DEFAULT_NUM_TO_LOAD = 50;

const router = express.Router();

router.get('/sources', asyncHandler(async (req, res) => {
  res.send(SourceService.findAll());
}));
router.get('/source/info', asyncHandler(async (req, res) => {
  const id = req.query.id;
  res.send(SourceService.getSource(id));
}));

router.get('/source/photos', asyncHandler(async (req, res) => {
  const sourceId = parseInt(req.query.id);

  if (!sourceId) { missingParam(res, 'id'); return; }

  const start = parseInt(req.query.start) || 0;
  const num = parseInt(req.query.num) || DEFAULT_NUM_TO_LOAD;

  const files = SourceService.findFilesFrom(sourceId, start, num);

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
  const sourceId = req.query.sourceId;

  if (!id) { missingParam(res, 'id'); return; }
  if (!size) { missingParam(res, 'size'); return; }

  const fileData = await SourceService.getSourceFileData(sourceId, id, size);

  if (fileData) {
    const { data, fileType } = fileData;
    res.contentType(fileType);
    res.send(data);
  } else {
    res.status(404).send('Photo not found.');
  }
}));


router.get('/albums', asyncHandler(async (req, res) => {
  res.send(AlbumService.findAllAlbums());
}));
router.get('/album/info', asyncHandler(async (req, res) => {
  const id = req.query.id;
  res.send(AlbumService.getAlbum(id));
}));
router.get('/album/photos', asyncHandler(async (req, res) => {
  const albumId = parseInt(req.query.id);

  if (!albumId) { missingParam(res, 'id'); return; }

  const start = parseInt(req.query.start) || 0;
  const num = parseInt(req.query.num) || DEFAULT_NUM_TO_LOAD;

  const files = AlbumService.getAlbumFiles(albumId, start, start + num);
  const hasMorePhotos = files.length >= num;
  res.send({
    info: {
      hasMorePhotos,
    },
    photos: files,
  });
}));

router.post('/album', asyncHandler(async (req, res) => {
  const name = req.body.name;
  const files = req.body.files;
  const albumId = req.body.albumId;

  if (!name && !albumId) { throw new Error('Missing parameter: name.'); }
  
  if (albumId) {
    AlbumService.addToAlbum(albumId, files);
  } else {
    AlbumService.createAlbum(name, files);
  }
  
  res.sendStatus(200);
}));

module.exports = router;