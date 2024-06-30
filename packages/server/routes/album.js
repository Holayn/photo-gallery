const express = require('express');

const AlbumService = require('../services/album');
const { AlbumDAO } = require('../services/db');
const AuthController = require('../controllers/auth');
const {
  asyncHandler,
  requiredBody,
  requiredParams,
} = require('../util/route-utils');

const router = express.Router();

router.get(
  '/albums',
  AuthController.authAdmin,
  asyncHandler(async (req, res) => {
    res.send(AlbumDAO.findAll());
  })
);
router.get(
  '/album/info',
  requiredParams(['id']),
  AuthController.authAlbum,
  asyncHandler(async (req, res) => {
    const albumId = req.query.id;
    const album = AlbumDAO.getById(albumId);
    if (album) {
      res.send(album);
    } else {
      res.status(404).send('Album not found.');
    }
  })
);
router.get(
  '/album/photos',
  requiredParams(['id']),
  AuthController.authAlbum,
  asyncHandler(async (req, res) => {
    const albumId = req.query.id;
    const start = parseInt(req.query.start, 10) || 0;
    const imagePreviewHeight = parseInt(req.query.imagePreviewHeight, 10);
    const imagePreviewArea = parseInt(req.query.imagePreviewArea, 10);

    const data = AlbumService.getAlbumFilesCoveringArea(
      albumId,
      start,
      imagePreviewHeight,
      imagePreviewArea
    );
    if (data == null) {
      res.sendStatus(400);
    } else {
      res.send(data);
    }
  })
);

router.post(
  '/album',
  requiredBody(['files']),
  AuthController.authAdmin,
  asyncHandler(async (req, res) => {
    const { name } = req.body;
    const { files } = req.body;
    const { albumId } = req.body;

    if (!name && !albumId) {
      requiredBody(['name', 'albumId']);
    }

    if (albumId) {
      AlbumService.addToAlbum(albumId, files);
    } else {
      AlbumService.createAlbum(name, files);
    }

    res.sendStatus(200);
  })
);

module.exports = router;
