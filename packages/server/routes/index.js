const express = require('express');

const AlbumService = require('../services/album');
const SourceService = require('../services/source');
const UserService = require('../services/user');

const Album = require('../model/album');
const AlbumFile = require('../model/album-file');
const File = require('../model/file');

const AuthController = require('../controllers/auth');

require('dotenv').config();

const asyncHandler = fn => (req, res, next) => {
  return Promise
      .resolve(fn(req, res, next))
      .catch(next);
};

const missingParam = (res, parameterName) => { res.status(400).send(`Missing parameter: ${parameterName}`); }
const missingProperty = (res, propertyName) => { res.status(400).send(`Missing property: ${propertyName}`); }

const requiredParams = (params) => { 
  return (req, res, next) => {
    for (const p of params) {
      if (!req.query.hasOwnProperty(p)) {
        missingParam(res, p);
        return;
      }
    }

    next();
  };
};

const requiredBody = (properties) => { 
  return (req, res, next) => {
    for (const p of properties) {
      if (!req.body.hasOwnProperty(p)) {
        missingProperty(res, p);
        return;
      }
    }

    next();
  };
};

const DEFAULT_NUM_TO_LOAD = 50;

const router = express.Router();

router.post('/auth', requiredBody(['password']), asyncHandler(async (req, res) => {
  if (UserService.isValidUser('admin', req.body.password)) {
    // send jwt
    res.sendStatus(200);
  } else {
    res.sendStatus(401);
  }
}));

router.get('/sources', requiredParams(['password']), AuthController.authAdmin, asyncHandler(async (req, res) => {
  res.send(SourceService.findAll());
}));
router.get('/source/info', requiredParams(['password']), AuthController.authAdmin, asyncHandler(async (req, res) => {
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
  const token = req.query.token;

  if (!id) { missingParam(res, 'id'); return; }
  if (!size) { missingParam(res, 'size'); return; }
  // if (!token) { missingParam(res, 'token'); return; }

  if (token) {
    const file = File.getBySource(sourceId, id);
    const album = Album.getByToken(token);
    const albumFile = AlbumFile.getByAlbumIdFileId(album.id, file.id);
  
    if (!albumFile) {
      res.sendStatus(403);
      return;
    }
  }

  

  const fileData = await SourceService.getSourceFileData(sourceId, id, size);

  if (fileData) {
    const { data, fileType } = fileData;
    res.contentType(fileType);
    res.send(data);
  } else {
    res.status(404).send('Photo not found.');
  }
}));

function checkAccessToAlbum(albumId, token) {
  const album = AlbumService.getAlbum(albumId);
  return album.token === token;
}
router.get('/albums', asyncHandler(async (req, res) => {
  res.send(AlbumService.findAllAlbums());
}));
router.get('/album/info', asyncHandler(async (req, res) => {
  const id = req.query.id;
  const token = req.query.token;
  const album = AlbumService.getAlbum(id);

  if (checkAccessToAlbum(id, token)) {
    res.send(album);
  } else {
    res.sendStatus(403);
  }
}));
router.get('/album/photos', asyncHandler(async (req, res) => {
  const albumId = parseInt(req.query.id);
  const token = req.query.token;

  if (!albumId) { missingParam(res, 'id'); return; }

  if (checkAccessToAlbum(albumId, token)) {
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
  } else {
    res.sendStatus(403);
  }
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