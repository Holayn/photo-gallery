const express = require('express');
const webpush = require('web-push');

const AuthController = require('../controllers/auth');
const { UserDAO, PushSubscriptionDAO } = require('../services/db');
const { asyncHandler, requiredBody } = require('../util/route-utils');

const router = express.Router();

router.post(
  '/save-push-subscription',
  AuthController.authAdmin,
  asyncHandler(async (req, res) => {
    const { username } = req.session.user;
    const subscription = req.body;
    const user = UserDAO.getByUsername(username);

    if (!user) {
      res.status(400).send('Failed to find user from session');
      return;
    }

    if (!subscription || !subscription.endpoint) {
      res.status(400).send('Invalid subscription');
      return;
    }

    PushSubscriptionDAO.upsert({ userId: user.id, subscription });

    res.sendStatus(200);

  })
)

router.post(
  '/test-push-notification',
  AuthController.authAdmin,
  requiredBody(['username']),
  asyncHandler(async (req, res) => {
    const { username } = req.body;
    const user = UserDAO.getByUsername(username);

    if (!user) {
      res.status(400).send('Failed to find user');
      return;
    }

    const subscriptions = PushSubscriptionDAO.findByUserId(user.id);

    if (!subscriptions.length) {
      res.status(400).send('User has no push subscriptions');
      return;
    }

    const payload = JSON.stringify({
      title: 'Test Notification',
      body: 'This is a test push notification.',
      icon: '/icon-192x192.png',
    });

    const results = await Promise.all(subscriptions.map(async ({ id, subscription }) => {
      try {
        await webpush.sendNotification(subscription, payload);
        return { id, success: true };
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          PushSubscriptionDAO.deleteById(id);
        }
        return { id, success: false, error: err.message };
      }
    }));

    res.send({ results });
  })
)

module.exports = router;