const express = require('express');

const AuthController = require('../controllers/auth');
const { UserDAO, UserExploreHistoryDAO } = require('../services/db');
const { getNext } = require('../services/explore');
const { asyncHandler } = require('../util/route-utils');

const router = express.Router();

router.get(
  '/explore/next',
  AuthController.authAdmin,
  asyncHandler(async (req, res) => {
    const { username } = req.session.user;
    const user = UserDAO.getByUsername(username);

    if (!user) {
      return res.status(400).send('Failed to find user from session');
    }

    res.json(getNext(user));
  })
);

router.post(
  '/explore/history/clear',
  AuthController.authAdmin,
  asyncHandler(async (req, res) => {
    const { username } = req.session.user;
    const user = UserDAO.getByUsername(username);

    if (!user) {
      return res.status(400).send('Failed to find user from session');
    }

    UserExploreHistoryDAO.deleteByUserId(user.id);
    res.sendStatus(200);
  })
);

module.exports = router;
