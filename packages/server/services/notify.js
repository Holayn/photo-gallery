const axios = require('axios');
const logger = require('./logger');
const { notifyUrl, isDevelopment } = require('./config');

/**
 * Send a push notification via the configured NOTIFY_URL.
 *
 * @param {string}  message  – notification body
 * @param {string}  [username]   – optional target username for the notification service
 * @returns {Promise<void>}
 */
async function notify(message) {
  if (isDevelopment || !notifyUrl) {
    console.log(message);
    return;
  }

  try {
    const data = { message };
    await axios(notifyUrl, { method: 'post', data });
  } catch (e) {
    logger.error('Failed to send notification', e);
  }
}

module.exports = notify;
