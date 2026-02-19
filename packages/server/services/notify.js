const axios = require('axios');
const logger = require('./logger');
const { notifyUrl } = require('./config');

/**
 * Send a push notification via the configured NOTIFY_URL.
 *
 * @param {string}  message  – notification body
 * @param {string}  [user]   – optional target user for the notification service
 * @returns {Promise<void>}
 */
async function notify(message, user) {
  if (!notifyUrl) return;

  try {
    const data = { message };
    if (user) data.user = user;

    await axios(notifyUrl, { method: 'post', data });
  } catch (e) {
    logger.error('Failed to send notification', e);
  }
}

module.exports = notify;
