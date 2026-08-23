const axios = require('axios');
const logger = require('./logger');
const { notifyUrl, isDevelopment } = require('./config');

/**
 * Send a notification via the configured NOTIFY_URL webhook. When no
 * `discordUserId` is given, the webhook defaults to notifying the server admin.
 *
 * Signature matches kaiauth's `SendDiscordDM` type so this can be passed
 * directly as the `discord` callback for kaiauth's 2FA delivery.
 *
 * @param {string} [discordUserId]  – Discord user id to notify
 * @param {string} message          – notification body
 * @returns {Promise<void>}
 */
async function notify(discordUserId, message) {
  if (isDevelopment) {
    console.log(message);
    return;
  }

  try {
    const data = { message: `photo-gallery: ${message}`, user: discordUserId };
    await axios(notifyUrl, { method: 'post', data });
  } catch (e) {
    logger.error('Failed to send notification', e);
  }
}

module.exports = notify;
