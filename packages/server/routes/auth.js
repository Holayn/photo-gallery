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
  notify: (message, user) => !config.isDevelopment 
    ? notify(message, user) 
    : console.log(`[${user || '(no user)'}] -> ${message}`),
});

module.exports = { router };
