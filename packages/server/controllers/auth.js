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
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

const AuthController = {
  authAdmin(req, res, next) {
    return isLoggedIn(req) ? next() : res.sendStatus(401);
  },

  authPhoto(req, res, next) {
    const { sourceFileId, sourceId, id: albumId, token: albumToken } = req.query;

    if (isLoggedIn(req)) return next();

    if (albumToken) {
      const file = GalleryFileDAO.getBySource(sourceId, sourceFileId);
      if (file) {
        const album = AlbumDAO.getByIdToken(albumId, albumToken);
        if (album) {
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
      if (album && timingSafeCompare(album.token, albumToken)) {
        return next();
      }
    }

    return res.sendStatus(401);
  },
};

module.exports = AuthController;
