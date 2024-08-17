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
  requiredParams(['id']),
  AuthController.authAlbum,
  (req, res) => {
    const { id: albumId } = req.query;

    const files = AlbumService.getAlbumFiles(albumId);
    if (!files) {
      res.sendStatus(400);
    } else {
      res.send({
        files,
      });
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
