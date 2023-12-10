const AlbumService = require("../services/album");
const Album = require("../model/album");
const AlbumFile = require("../model/album-file");
const File = require("../model/file");
const UserService = require("../services/user");

const MAX_ATTEMPTS = 3;
const ATTEMPT_TIMEOUT = 3600000;

async function validateAdmin(req) {
  return req.session.user;
}

const attempts = {};
function canAttempt(username) {
  if (UserService.getUserByUsername(username)) {
    return !attempts[username] || attempts[username] < MAX_ATTEMPTS;
  }
  return false;
}
function registerAttempt(username) {
  if (!attempts[username]) {
    attempts[username] = 0;
  }
  attempts[username] = attempts[username] + 1;

  setTimeout(() => {
    if (attempts[username]) {
      attempts[username] = attempts[username] - 1;
      if (attempts[username] <= 0) {
        clearAttempts(username);
      }
    }
  }, ATTEMPT_TIMEOUT);
}
function clearAttempts(username) {
  delete attempts[username];
}

const AuthController = {
  async auth(req, res, next) {
    const username = req.body.username;
    const password = req.body.password;

    if (canAttempt(username)) {
      registerAttempt(username);

      const user = UserService.getUser(username, password);
      if (user) {
        clearAttempts(username);

        return req.session.regenerate((regenErr) => {
          if (regenErr) next(regenErr);
          req.session.user = {
            name: user,
          };
          req.session.save((saveErr) => {
            if (saveErr) next(saveErr);
            res.sendStatus(200);
          });
        });
      }
    }
    
    // A failed auth shouldn't result in a 401, because the user wasn't denied access to this route.
    res.send({
      success: false,
    });
  },

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
