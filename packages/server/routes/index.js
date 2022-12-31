const express = require('express');

const AlbumService = require('../services/album');
const AuthService = require('../services/auth');
const SourceService = require('../services/source');
const UserService = require('../services/user');

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
    res.send({
      token: await AuthService.generateToken('admin'),
    });
  } else {
    res.sendStatus(401);
  }
}));
router.get('/auth/verify', AuthController.authAdmin, asyncHandler(async (req, res) => {
  res.sendStatus(200);
}));

router.get('/sources', AuthController.authAdmin, asyncHandler(async (req, res) => {
  res.send(SourceService.findAll());
}));
router.get('/source/info', AuthController.authAdmin, asyncHandler(async (req, res) => {
  const id = req.query.id;
  res.send(SourceService.getSource(id));
}));
/**
 * Returns:
 * {
 *  info: {
 *    hasMorePhotos: boolean;
 *  },
 *  photos: {
 *    date: number;
 *    metadata: object;
 *    sourceFileId: string;
 *  }[]
 * }
 */
router.get('/source/photos', AuthController.authAdmin, asyncHandler(async (req, res) => {
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

router.get('/photo', requiredParams(['id', 'sourceId', 'size']), AuthController.authPhoto, asyncHandler(async (req, res) => {
  const id = req.query.id;
  const size = req.query.size;
  const sourceId = req.query.sourceId;
  const token = req.query.token;

  const fileData = await SourceService.getSourceFileData(sourceId, id, size);

  if (fileData) {
    const { data, fileType } = fileData;
    res.contentType(fileType);
    res.send(data);
  } else {
    res.status(404).send('Photo not found.');
  }
}));

router.get('/albums', AuthController.authAdmin, asyncHandler(async (req, res) => {
  res.send(AlbumService.findAllAlbums());
}));
router.get('/album/info', requiredParams(['id']), AuthController.authAlbum, asyncHandler(async (req, res) => {
  const albumId = req.query.id;
  res.send(AlbumService.getAlbum(albumId));
}));
/**
 * Returns:
 * {
 *  info: {
 *    hasMorePhotos: boolean;
 *  },
 *  photos: {
 *    date: number;
 *    metadata: object;
 *    sourceId: string;  
 *    sourceFileId: string;
 *  }[]
 * }
 */
router.get('/album/photos', requiredParams(['id']), AuthController.authAlbum, asyncHandler(async (req, res) => {
  const albumId = req.query.id;
  const start = parseInt(req.query.start) || 0;
  const num = parseInt(req.query.num) || DEFAULT_NUM_TO_LOAD;

  if (!albumId) { missingParam(res, 'id'); return; }

  const files = AlbumService.getAlbumFiles(albumId, start, start + num);
  const hasMorePhotos = files.length >= num;

  res.send({
    info: {
      hasMorePhotos,
    },
    photos: files,
  });
}));

/**
 * Accepts:
 * {
 *  name: string;
 *  albumId: number;
 *  files: {
 *    sourceId: number;
 *    sourceFileId: string;
 *  }[]
 * }
 */
router.post('/album', AuthController.authAdmin, asyncHandler(async (req, res) => {
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