const config = require('../services/config');
const { createAuthRouter } = require('kaiauth');
const notify = require('../services/notify');

const { router } = createAuthRouter({
  sessionSecret: config.sessionSecret,
  buildCookieOptions: (extra) => ({
    httpOnly: true,
    sameSite: 'strict',
    secure: !config.isDevelopment,
    ...extra,
  }),
  notify: (message, username) => {
    if (!config.isDevelopment) {
      notify(message, username);
    } else {
      console.log(`[${username || '(no user)'}] -> ${message}`);
    }
  },
});

module.exports = { router };
