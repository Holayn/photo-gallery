const AlbumService = require("../services/album");
const Album = require("../model/album");
const AlbumFile = require("../model/album-file");
const File = require("../model/file");

async function validateAdmin(req) {
  return req.session.user;
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
    const { sourceFileId } = req.query;
    const { sourceId } = req.query;
    const { albumToken } = req.query;

    if (albumToken) {
      const file = File.getBySource(sourceId, sourceFileId);
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
    const { albumToken } = req.query;

    if (albumToken) {
      const albumId = req.query.id;
      const album = AlbumService.getAlbum(albumId);
      if (album.token === req.query.albumToken) {
        next();
      } else {
        res.sendStatus(401);
      }
    } else if (await validateAdmin(req)) {
      next();
    } else {
      res.sendStatus(401);
    }
  },
};

module.exports = AuthController;
