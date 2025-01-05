const axios = require('axios');
const crypto = require('crypto');
const {
  AlbumDAO,
  AlbumFileDAO,
  GalleryFileDAO,
  UserDAO,
} = require('../services/db');
const UserService = require('../services/user');
const logger = require('../services/logger');

require('dotenv').config();

const MAX_ATTEMPTS = 3;

function validateAdmin(req) {
  return (
    req.session.user && req.cookies.PUBLICKEY === req.session.user.publicKey
  );
}

class Attemptor {
  attempts = {};

  constructor(isValidAttemptFn) {
    this.isValidAttemptFn = isValidAttemptFn;
  }

  canAttempt(key) {
    if (this.attempts[key] >= MAX_ATTEMPTS) {
      return false;
    }

    return this.isValidAttemptFn(key);
  }

  registerAttempt(key) {
    if (!this.attempts[key]) {
      this.attempts[key] = 0;
    }
    this.attempts[key] += 1;
  }

  clearAttempts(key) {
    delete this.attempts[key];
  }
}

const loginAttemptor = new Attemptor((username) => !!UserDAO.getByUsername(username));

const twoFAKeys = {};
const twoFaAttemptor = new Attemptor((key) => !!twoFAKeys[key]);

const getTwoFABypassToken = (username, password) => crypto.createHash('sha256').update(username + password).digest('hex');

const AuthController = {
  auth(req, res) {
    const { username, password } = req.body;
    const { TWOFABYPASS: twoFABypass } = req.cookies;

    if (loginAttemptor.canAttempt(username)) {
      loginAttemptor.registerAttempt(username);

      const user = UserService.getUser(username, password);
      const canBypassTwoFA = twoFABypass === getTwoFABypassToken(username, password)
      const doTwoFA = !twoFABypass || !canBypassTwoFA;

      if (user) {
        loginAttemptor.clearAttempts(username);

        const publicKey = crypto.randomBytes(32).toString('hex');
        res.cookie('PUBLICKEY', publicKey, {
          httpOnly: true,
          sameSite: 'strict',
          secure: process.env.ENV !== 'development',
        });

        if (doTwoFA) {
          const twoFAKey = crypto.randomBytes(32).toString('hex');
          res.cookie('TWOFAKEY', twoFAKey, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.ENV !== 'development',
          });
  
          Object.keys(twoFAKeys).forEach((key) => {
            if (twoFAKeys[key].username === username) {
              delete twoFAKeys[key];
            }
          });
  
          twoFAKeys[twoFAKey] = {
            publicKey,
            username,
            twoFABypass: getTwoFABypassToken(username, password),
            code: Array.from({ length: 6 }, () =>
              Math.random().toString(36).substring(2, 3)
            )
              .join('')
              .toUpperCase(),
          };
  
          setTimeout(() => {
            // Token valid for 1 minute.
            delete twoFAKeys[twoFAKey];
          }, 1000 * 60);

          if (process.env.ENV !== 'development') {
            (async () => {
              try {
                await axios(process.env.NOTIFY_URL, {
                  method: 'post',
                  data: {
                    message: `${username} passed initial auth (${req.ip})`,
                  },
                });
              } catch (e) {
                logger.error('Failed to send login notification', e);
              }
            })();
          }
  
          if (process.env.ENV !== 'development') {
            (async () => {
              try {
                await axios(process.env.NOTIFY_URL, {
                  method: 'post',
                  data: {
                    message: twoFAKeys[twoFAKey].code,
                    user: user.notifyUser,
                  },
                });
              } catch (e) {
                logger.error('Failed to send 2FA code', e);
              }
            })();
          } else {
            console.log(user.notifyUser, twoFAKeys[twoFAKey].code);
          }

          res.send({ twoFA: true });
        } else {
          if (process.env.ENV !== 'development') {
            (async () => {
              try {
                await axios(process.env.NOTIFY_URL, {
                  method: 'post',
                  data: {
                    message: `${username} logged in with 2FA bypass (${req.ip})`,
                  },
                });
              } catch (e) {
                logger.error('Failed to send login notification', e);
              }
            })();
          }

          req.session.regenerate((regenErr) => {
            if (regenErr) {
              next(regenErr);
            }
  
            req.session.user = {
              publicKey,
              username,
            };
            req.session.save((saveErr) => {
              if (saveErr) {
                next(saveErr);
                return;
              }
  
              res.sendStatus(200);
            });
          });
        }

        return;
      }
    }

    // A failed auth shouldn't result in a 401, because the user wasn't denied access to this route.
    res.send({
      success: false,
    });
  },
  authTwoFa(req, res, next) {
    const { twoFACode } = req.body;
    const { PUBLICKEY: publicKey, TWOFAKEY: twoFAKey } = req.cookies;
    if (twoFaAttemptor.canAttempt(twoFAKey)) {
      twoFaAttemptor.registerAttempt(twoFAKey);

      if (
        publicKey === twoFAKeys[twoFAKey].publicKey &&
        twoFACode === twoFAKeys[twoFAKey].code
      ) {
        twoFaAttemptor.clearAttempts(twoFAKey);

        if (process.env.ENV !== 'development') {
          (async () => {
            try {
              await axios(process.env.NOTIFY_URL, {
                method: 'post',
                data: {
                  message: `${twoFAKeys[twoFAKey].username} logged in, passed 2FA (${req.ip})`,
                },
              });
            } catch (e) {
              logger.error('Failed to send 2FA notification', e);
            }
          })();
        }

        res.cookie('TWOFAKEY', '', {
          httpOnly: true,
          sameSite: 'strict',
          secure: process.env.ENV !== 'development',
          maxAge: 0,
        });

        res.cookie('TWOFABYPASS', twoFAKeys[twoFAKey].twoFABypass, {
          httpOnly: true,
          sameSite: 'strict',
          secure: process.env.ENV !== 'development',
          maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        getTwoFABypassToken

        req.session.regenerate((regenErr) => {
          if (regenErr) {
            next(regenErr);
          }

          req.session.user = {
            publicKey,
            username: twoFAKeys[twoFAKey].username,
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
    const { sourceFileId, sourceId, token: albumId, albumToken } = req.query;

    if (validateAdmin(req)) {
      next();
      return;
    }
    if (albumToken) {
      const file = GalleryFileDAO.getBySource(sourceId, sourceFileId);
      if (file) {
        const album = AlbumDAO.getByIdToken(albumId, albumToken);
        if (!album) {
          res.sendStatus(401);
          return;
        }

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
    const { token: albumToken, id: albumId } = req.query;

    if (validateAdmin(req)) {
      next();
      return;
    }
    if (albumToken) {
      const album = AlbumDAO.getByIdAlias(albumId);
      if (!album) {
        res.sendStatus(401);
        return;
      }

      if (album.token === albumToken) {
        next();
        return;
      }
    }

    res.sendStatus(401);
  },
};

module.exports = AuthController;
