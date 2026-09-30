const express = require('express');

const AlbumService = require('../services/album');
const { AlbumDAO, UserDAO, AlbumAssignmentDAO } = require('../services/db');
const AuthController = require('../controllers/auth');
const { requiredBody, requiredParams } = require('../util/route-utils');

const router = express.Router();

router.get('/albums', AuthController.authAdmin, (req, res) => {
  const { username } = req.session.user;
  const user = UserDAO.getByUsername(username);
  if (!user) {
    res.status(400).send('Failed to find user from session');
    return;
  }

  let albums = AlbumDAO.findAll();
  if (req.query.assigned === 'true') {
    albums = albums.filter((album) => AlbumAssignmentDAO.isAssigned(user.id, album.id));
  }

  res.send(
    albums
      .sort((a, b) => b.id - a.id)
      .map((album) => ({
        ...album,
        id: album.idAlias,
        fileCount: AlbumService.getFileCount(album.id),
        users: AlbumAssignmentDAO.findUsersByAlbumId(album.id).filter((u) => u.id !== user.id),
        isMine: album.createdBy === user.id,
      }))
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

    const files = AlbumService.getAlbumFiles(album.id, albumId, req.query.token);
    if (!files) {
      res.sendStatus(400);
    } else {
      res.send({ files });
    }
  }
);

router.post(
  '/album',
  requiredBody(['files']),
  AuthController.authAdmin,
  (req, res) => {
    const { name, files, albumId } = req.body;
    const { username } = req.session.user;
    const user = UserDAO.getByUsername(username);
    if (!user) {
      res.status(400).send('Failed to find user from session');
      return;
    }

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

      AlbumService.addToAlbum(album.id, files, user.id);
      res.send({
        id: albumId,
        name: album.name,
      });
    } else {
      const id = AlbumService.createAlbum(name, files, user.id);
      const album = AlbumDAO.getById(id);
      res.send({
        id: album.idAlias,
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
  '/album/delete',
  requiredBody(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: albumId } = req.body;

    const album = AlbumDAO.getByIdAlias(albumId);
    if (!album) {
      res.sendStatus(400);
      return;
    }

    AlbumService.deleteAlbum(album.id);

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

router.get(
  '/album/users',
  requiredParams(['id']),
  AuthController.authAdmin,
  (req, res) => {
    const { id: albumId } = req.query;
    const { username } = req.session.user;
    const user = UserDAO.getByUsername(username);
    if (!user) {
      res.status(400).send('Failed to find user from session');
      return;
    }

    const album = AlbumDAO.getByIdAlias(albumId);
    if (!album) {
      res.sendStatus(400);
      return;
    }

    const users = AlbumAssignmentDAO.findUsersByAlbumId(album.id);
    res.send(users);
  }
);

router.post(
  '/album/users',
  requiredBody(['albumId', 'userId']),
  AuthController.authAdmin,
  (req, res) => {
    const { albumId, userId } = req.body;
    const targetUserId = parseInt(userId, 10);

    const album = AlbumDAO.getByIdAlias(albumId);
    if (!album) {
      res.sendStatus(400);
      return;
    }

    if (targetUserId === album.createdBy) {
      res.status(400).send({ message: 'The album creator is already assigned and cannot be added.' });
      return;
    }

    const result = AlbumAssignmentDAO.insert({ userId: targetUserId, albumId: album.id });
    if (result) {
      res.send({ success: true, id: result });
    } else {
      res.send({ success: false, message: 'Association already exists or failed' });
    }
  }
);

router.post(
  '/album/users/delete',
  requiredBody(['albumId', 'userId']),
  AuthController.authAdmin,
  (req, res) => {
    const { albumId, userId } = req.body;
    const { username } = req.session.user;
    const user = UserDAO.getByUsername(username);
    if (!user) {
      res.status(400).send('Failed to find user from session');
      return;
    }

    const targetUserId = parseInt(userId, 10);

    const album = AlbumDAO.getByIdAlias(albumId);
    if (!album) {
      res.sendStatus(400);
      return;
    }

    if (targetUserId === album.createdBy) {
      res.status(400).send({ message: 'The album creator cannot be removed from an album.' });
      return;
    }

    const changes = AlbumAssignmentDAO.delete({ userId: targetUserId, albumId: album.id });
    res.send({ success: changes > 0 });
  }
);

module.exports = router;
