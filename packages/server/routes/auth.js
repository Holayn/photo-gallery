const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const AuthController = require('../controllers/auth');
const AuthService = require('../services/auth');
const { requiredBody } = require('../util/route-utils');

require('dotenv').config();

const router = express.Router();

const sessionStore = new SQLiteStore({
  db: './sessions.db',
});

router.use(
  session({
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.ENV !== 'development',
    },
    name: 'session',
    proxy: true,
    resave: false,
    rolling: true,

    saveUninitialized: false,
    secret: AuthService.getSecret(),
    store: sessionStore,
  })
);

router.post(
  '/auth',
  requiredBody(['username', 'password']),
  AuthController.auth
);
router.post('/auth/2fa', requiredBody(['twoFACode']), AuthController.authTwoFa);

router.post('/auth/logout', AuthController.authAdmin, (req, res, next) => {
  req.session.user = null;
  req.session.save((saveErr) => {
    if (saveErr) next(saveErr);

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate((regenErr) => {
      if (regenErr) next(regenErr);
      res.sendStatus(200);
    });
  });
});

router.post(
  '/auth/invalidate-all-sessions',
  AuthController.authAdmin,
  (req, res) => {
    sessionStore.db.prepare('DELETE FROM sessions').run();
    res.sendStatus(200);
  }
);

router.get('/auth/verify', AuthController.authAdmin, (req, res, next) => {
  const oldSessionData = req.session.user;

  req.session.regenerate((regenErr) => {
    if (regenErr) {
      next(regenErr);
    }

    // Copy old session data to the new session
    req.session.user = oldSessionData;

    req.session.save((saveErr) => {
      if (saveErr) {
        next(saveErr);
        return;
      }

      res.sendStatus(200);
    });
  });
});

module.exports = router;
