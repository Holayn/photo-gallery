const crypto = require('crypto');

const {
  AlbumDAO,
  AlbumFileDAO,
  GalleryFileDAO,
} = require('../services/db');

function isLoggedIn(req) {
  return !!req.session.user;
}

function timingSafeCompare(a, b) {
  if (!a || !b) {
    return;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

const AuthController = {
  authAdmin(req, res, next) {
    return isLoggedIn(req) ? next() : res.sendStatus(401);
  },

  authPhoto(req, res, next) {
    const { sourceFileId, sourceId, id: albumId, token } = req.query;

    if (isLoggedIn(req)) return next();

    if (token) {
      const file = GalleryFileDAO.getBySource(sourceId, sourceFileId);
      if (file) {
        if (timingSafeCompare(file.token, token)) {
          return next();
        }

        const album = AlbumDAO.getByIdAlias(albumId);
        if (album && AuthController.isValidAlbumToken(album, token)) {
          const albumFile = AlbumFileDAO.getByAlbumIdFileId(album.id, file.id);
          if (albumFile) return next();
        }
      }
    }

    return res.sendStatus(401);
  },

  authAlbum(req, res, next) {
    const { token: albumToken, id: albumId } = req.query;

    if (isLoggedIn(req)) return next();

    if (albumToken) {
      const album = AlbumDAO.getByIdAlias(albumId);
      if (album && AuthController.isValidAlbumToken(album, albumToken)) {
        return next();
      }
    }

    return res.sendStatus(401);
  },

  isValidAlbumToken(album, token) {
    return !!(album && album.token && token && timingSafeCompare(album.token, token));
  },
};

module.exports = AuthController;
