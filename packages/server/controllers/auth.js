const AuthService = require('../services/auth');
const AlbumService = require('../services/album');
const Album = require('../model/album');
const AlbumFile = require('../model/album-file');
const File = require('../model/file');

function getBearerToken(authorization) {
  if (authorization) {
    return authorization.split(' ')[1];
  }
  return null;
}

async function validateAdmin(req) {
  const token = getBearerToken(req.headers.authorization);
  if (token) {
    return await AuthService.validateToken(token);
  }

  return false;
}

const AuthController = {
  async authAdmin(req, res, next) {
    if (await validateAdmin(req)) {
      next();
    } else {
      res.sendStatus(401);
    }
  },

  async authPhoto(req, res, next) {
    const id = req.query.id;
    const sourceId = req.query.sourceId;
    const albumToken = req.query.token;

    if (albumToken) {
      const file = File.getBySource(sourceId, id);
      if (file) {
        const album = Album.getByToken(albumToken);
        if (album) {
          const albumFile = AlbumFile.getByAlbumIdFileId(album.id, file.id);
          if (albumFile) {
            next();
          } else {
            res.sendStatus(401);
          }
        } else {
          res.sendStatus(401);
        }
      } else {
        res.sendStatus(401);
      }
    } else if (await validateAdmin(req)) {
      next();
    } else {
      res.sendStatus(401);
    }
  },

  async authAlbum(req, res, next) {
    if (await validateAdmin(req)) {
      next();
    } else {
      const albumId = req.query.id;
      const album = AlbumService.getAlbum(albumId);
      if (album.token === req.query.token) {
        next();
      } else {
        res.sendStatus(401);
      }
    }
  },
}

module.exports = AuthController;