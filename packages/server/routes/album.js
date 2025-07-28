const express = require('express');

const AlbumService = require('../services/album');
const { AlbumDAO } = require('../services/db');
const AuthController = require('../controllers/auth');
const { requiredBody, requiredParams } = require('../util/route-utils');

const router = express.Router();

router.get('/albums', AuthController.authAdmin, (req, res) => {
  res.send(
    AlbumDAO.findAll().sort((a, b) => b.id - a.id).map((album) => ({ ...album, id: album.idAlias }))
  );
});

router.get(
  '/album/info',
  requiredParams(['id']),
  AuthController.authAlbum,
  (req, res) => {
    const { id: albumId } = req.query;
    const album = AlbumDAO.getByIdAlias(albumId);
    if (!album) {
      res.sendStatus(400);
      return;
    }

    if (album) {
      res.send({
        ...album,
        id: album.idAlias,
      });
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

    const album = AlbumDAO.getByIdAlias(albumId);
    if (!album) {
      res.sendStatus(400);
      return;
    }

    const files = AlbumService.getAlbumFiles(album.id);
    if (!files) {
      res.sendStatus(400);
    } else {
      res.send({
        files: files.map(f => {
          if (!f.urls) {
            return f;
          }

          return {
            ...f,
            urls: {
              view: Object.keys(f.urls.view).reduce((acc, size) => {
                acc[size] = f.urls.view[size] += `&id=${albumId}${req.query.token ? `&token=${req.query.token}` : ''}`;
                return acc;
              }, {}),
              download: f.urls.download += `&id=${albumId}${req.query.token ? `&token=${req.query.token}` : ''}`,
            } ,
          };
        }),
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
      const album = AlbumDAO.getByIdAlias(albumId);
      if (!album) {
        res.sendStatus(400);
        return;
      }

      AlbumService.addToAlbum(album.id, files);
      res.send({
        id: albumId,
        name: album.name,
      });
    } else {
      const id = AlbumService.createAlbum(name, files);
      const album = AlbumDAO.getById(id);
      res.send({
        id: album.idAlias, // todo: why this error?
        name: album.name,
      });
    }
  }
);

router.get(
  '/album/cover',
  requiredParams(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: albumId } = req.query;

    const album = AlbumDAO.getByIdAlias(albumId);
    const files = AlbumService.findCoverFiles(album.id);
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
  '/album/delete-files',
  requiredBody(['albumId', 'files']),
  AuthController.authAdmin,
  (req, res) => {
    const { files, albumId } = req.body;

    const album = AlbumDAO.getByIdAlias(albumId);

    if (!album) {
      res.sendStatus(400);
      return;
    }

    AlbumService.removeFromAlbum(album.id, files);

    res.sendStatus(200);
  }
);

router.post(
  '/album/share',
  requiredBody(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: albumId } = req.body;

    if (!albumId) {
      res.status(400).send('Missing albumId.');
      return;
    }

    if (albumId) {
      const album = AlbumDAO.getByIdAlias(albumId);
      if (!album) {
        res.sendStatus(400);
        return;
      }

      const token = AlbumService.generateAlbumToken(album.id);
      res.send({
        token,
      });
    } else {
      res.sendStatus(400);
    }
  }
);

module.exports = router;
