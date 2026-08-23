const config = require('../services/config');
const { createAuthRouter } = require('kaiauth');
const notify = require('../services/notify');

const { apiRouter, pageRouter } = createAuthRouter({
  authDataDir: config.dataDir,
  sessionSecret: config.sessionSecret,
  buildCookieOptions: (extra) => ({
    httpOnly: true,
    sameSite: 'strict',
    secure: !config.isDevelopment,
    ...extra,
  }),
  notify: (message) => {
    notify(undefined, message);
  },
  serveLoginPage: true,
  loginPageOptions: {
    title: 'kaifotos',
    apiBasePath: '/api',
  },
  development: config.isDevelopment,
  ...(!config.isDevelopment ? { discord: notify } : {}),
});

module.exports = { apiRouter, pageRouter };
