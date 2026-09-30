const webpush = require('web-push');

const logger = require('./logger');
const { vapidPublicKey, vapidPrivateKey, vapidEmail } = require('./config');
const { PushSubscriptionDAO } = require('./db');

webpush.setVapidDetails(
  `mailto:${vapidEmail}`,
  vapidPublicKey,
  vapidPrivateKey,
);

// Sends `payload` (a JSON string) to each of the given subscription records,
// cleaning up subscriptions the push service reports as gone (410/404).
async function sendToSubscriptions(subscriptions, payload) {
  await Promise.all(subscriptions.map(async ({ id, subscription }) => {
    try {
      await webpush.sendNotification(subscription, payload);
    } catch (err) {
      logger.error(`Failed to send push notification (subscription #${id})`, err);

      if (err.statusCode === 410 || err.statusCode === 404) {
        PushSubscriptionDAO.deleteById(id);
      }
    }
  }));
}

// Sends the same push notification to every subscribed device across all users.
async function notifyAll({ title, body, url }) {
  const subscriptions = PushSubscriptionDAO.findAll();
  if (!subscriptions.length) {
    return;
  }

  await sendToSubscriptions(subscriptions, JSON.stringify({ title, body, url, icon: '/icon-192x192.png' }));
}

// Sends the same push notification to every subscribed device for the given users only.
async function notifyUsers(userIds, { title, body, url }) {
  if (!userIds.length) {
    return;
  }

  const subscriptions = PushSubscriptionDAO.findByUserIds(userIds);
  if (!subscriptions.length) {
    return;
  }

  await sendToSubscriptions(subscriptions, JSON.stringify({ title, body, url, icon: '/icon-192x192.png' }));
}

module.exports = { notifyAll, notifyUsers, sendToSubscriptions };
