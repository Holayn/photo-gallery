const {
  AlbumDAO,
  AlbumFileDAO,
  GalleryFileDAO,
  UserDAO,
} = require('../services/db');
const UserService = require('../services/user');

const MAX_ATTEMPTS = 3;
const ATTEMPTS_CLEAR_TIMEOUT = 3600000;

function validateAdmin(req) {
  return req.session.user;
}

const attempts = {};
function canAttempt(username) {
  if (attempts[username] >= MAX_ATTEMPTS) {
    return false;
  }

  return !!UserDAO.getByUsername(username);
}
function registerAttempt(username) {
  if (!attempts[username]) {
    attempts[username] = 0;
  }
  attempts[username] += 1;

  setTimeout(() => {
    if (attempts[username]) {
      clearAttempts(username);
    }
  }, ATTEMPTS_CLEAR_TIMEOUT);
}
function clearAttempts(username) {
  delete attempts[username];
}

const AuthController = {
  auth(req, res, next) {
    const { username, password } = req.body;

    if (canAttempt(username)) {
      registerAttempt(username);

      const user = UserService.getUser(username, password);
      if (user) {
        clearAttempts(username);

        req.session.regenerate((regenErr) => {
          if (regenErr) {
            next(regenErr);
          }

          req.session.user = {
            name: username,
          };
          req.session.save((saveErr) => {
            if (saveErr) {
              next(saveErr);
              return;
            }

            res.sendStatus(200);
          });
        });

        return;
      }
    }

    // A failed auth shouldn't result in a 401, because the user wasn't denied access to this route.
    res.send({
      success: false,
    });
  },

  authAdmin(req, res, next) {
    if (validateAdmin(req)) {
      next();
      return;
    }

    res.sendStatus(401);
  },

  authPhoto(req, res, next) {
    const { sourceFileId, sourceId, albumToken } = req.query;

    if (validateAdmin(req)) {
      next();
      return;
    }
    if (albumToken) {
      const file = GalleryFileDAO.getBySource(sourceId, sourceFileId);
      if (file) {
        const album = AlbumDAO.getByToken(albumToken);
        if (album) {
          const albumFile = AlbumFileDAO.getByAlbumIdFileId(album.id, file.id);
          if (albumFile) {
            next();
            return;
          }
        }
      }
    }

    res.sendStatus(401);
  },

  authAlbum(req, res, next) {
    const { albumToken, id: albumId } = req.query;

    if (validateAdmin(req)) {
      next();
      return;
    }
    if (albumToken) {
      const album = AlbumDAO.getById(albumId);
      if (album.token === albumToken) {
        next();
        return;
      }
    }

    res.sendStatus(401);
  },
};

module.exports = AuthController;
