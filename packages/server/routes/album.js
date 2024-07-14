const express = require('express');

const AlbumService = require('../services/album');
const { AlbumDAO } = require('../services/db');
const AuthController = require('../controllers/auth');
const { requiredBody, requiredParams } = require('../util/route-utils');

const router = express.Router();

router.get('/albums', AuthController.authAdmin, (req, res) => {
  res.send(AlbumDAO.findAll());
});

router.get(
  '/album/info',
  requiredParams(['id']),
  AuthController.authAlbum,
  (req, res) => {
    const { id: albumId } = req.query;
    const album = AlbumDAO.getById(albumId);
    if (album) {
      res.send(album);
    } else {
      res.status(404).send('Album not found.');
    }
  }
);

router.get(
  '/album/photos',
  requiredParams(['id', 'start', 'imagePreviewHeight', 'imagePreviewArea']),
  AuthController.authAlbum,
  (req, res) => {
    const {
      id: albumId,
      start = 0,
      imagePreviewHeight,
      imagePreviewArea,
    } = req.query;

    const data = AlbumService.getAlbumFilesCoveringArea(
      albumId,
      parseInt(start, 10),
      parseInt(imagePreviewHeight, 10),
      parseInt(imagePreviewArea, 10)
    );
    if (!data) {
      res.sendStatus(400);
    } else {
      res.send(data);
    }
  }
);

router.post(
  '/album',
  requiredBody(['files']),
  AuthController.authAdmin,
  (req, res) => {
    const { name, files, albumId } = req.body;

    if (!name && !albumId) {
      res.status(400).send('Missing name or albumId.');
      return;
    }

    if (albumId) {
      AlbumService.addToAlbum(albumId, files);
    } else {
      AlbumService.createAlbum(name, files);
    }

    res.sendStatus(200);
  }
);

module.exports = router;
