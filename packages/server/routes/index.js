const express = require('express');
const axios = require('axios');

const AlbumService = require('../services/album');
const ApiService = require('../services/api');
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
router.get('/source/info', requiredParams(['id']), AuthController.authAdmin, asyncHandler(async (req, res) => {
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
router.get('/source/photos', requiredParams(['id']), AuthController.authAdmin, asyncHandler(async (req, res) => {
  const sourceId = parseInt(req.query.id);
  const start = parseInt(req.query.start) || 0;
  const num = parseInt(req.query.num) || DEFAULT_NUM_TO_LOAD;
  const directory = req.query.directory || null;

  res.send(ApiService.getSourceFiles(sourceId, start, num, directory));
}));
router.get('/source/directories', requiredParams(['id']), asyncHandler(async (req, res) => {
  const sourceId = parseInt(req.query.id);

  res.send(ApiService.getDirectories(sourceId));
}));

router.get('/photo', requiredParams(['sourceFileId', 'sourceId', 'size']), AuthController.authPhoto, asyncHandler(async (req, res) => {
  const sourceFileId = req.query.sourceFileId;
  const sourceId = req.query.sourceId;
  const size = req.query.size;

  const fileData = await SourceService.getSourceFileData(sourceId, sourceFileId, size);

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

  res.send(ApiService.getAlbumFiles(albumId, start, start + num));
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
router.post('/album', requiredBody(['files']), AuthController.authAdmin, asyncHandler(async (req, res) => {
  const name = req.body.name;
  const files = req.body.files;
  const albumId = req.body.albumId;

  if (!name && !albumId) { requiredBody(['name', 'albumId']); }
  
  if (albumId) {
    AlbumService.addToAlbum(albumId, files);
  } else {
    AlbumService.createAlbum(name, files);
  }
  
  res.sendStatus(200);
}));

router.get('/location', requiredParams(['lat', 'long']), asyncHandler(async (req, res) => {
  const { lat, long } = req.query;
  try {
    const { data } = await axios(`http://api.positionstack.com/v1/reverse?access_key=${process.env.POSITIONSTACK_APIKEY}&query=${lat},${long}`);
    if (data) {
      const [result] = data.data;
      res.send(result);
    }
  } catch (e) {
    res.sendStatus(400);
  }
}));

module.exports = router;