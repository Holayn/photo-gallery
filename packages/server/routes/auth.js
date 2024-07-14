const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const AuthController = require('../controllers/auth');
const AuthService = require('../services/auth');
const { requiredBody } = require('../util/route-utils');

require('dotenv').config();

const router = express.Router();

router.use(
  session({
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'strict',
      secure: process.env.ENV !== 'development',
    },
    name: 'session',
    proxy: true,
    resave: false,
    rolling: true,

    saveUninitialized: false,
    secret: AuthService.getSecret(),
    store: new SQLiteStore({
      db: 'sessions.db',
    }),
  })
);

router.post(
  '/auth',
  requiredBody(['username', 'password']),
  AuthController.auth
);

router.get('/auth/verify', AuthController.authAdmin, (req, res) => {
  res.sendStatus(200);
});

module.exports = router;
