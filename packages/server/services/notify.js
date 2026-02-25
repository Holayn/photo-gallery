const axios = require('axios');
const logger = require('./logger');
const { notifyUrl } = require('./config');
const { UserDAO } = require('./db');

/**
 * Send a push notification via the configured NOTIFY_URL.
 *
 * @param {string}  message  – notification body
 * @param {string}  [username]   – optional target username for the notification service
 * @returns {Promise<void>}
 */
async function notify(message, username) {
  if (!notifyUrl) return;

  try {
    const data = { message };
    if (username) {
      const user = UserDAO.getByUsername(username);
      if (user) {
        data.user = user.notifyUser || user.name;
      }
    }

    await axios(notifyUrl, { method: 'post', data });
  } catch (e) {
    logger.error('Failed to send notification', e);
  }
}

module.exports = notify;
