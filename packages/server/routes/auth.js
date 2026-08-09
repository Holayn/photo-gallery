const config = require('../services/config');
const { createAuthRouter } = require('kaiauth');
const notify = require('../services/notify');

const { router } = createAuthRouter({
  authDataDir: config.dataDir,
  sessionSecret: config.sessionSecret,
  buildCookieOptions: (extra) => ({
    httpOnly: true,
    sameSite: 'strict',
    secure: !config.isDevelopment,
    ...extra,
  }),
  notify: (message) => {
    notify(message);
  },
  serveLoginPage: true,
  loginPageOptions: {
    title: 'kaifotos',
  },
  development: config.isDevelopment,
  ...(!config.isDevelopment ? {
    discord: {
      botToken: config.discordBotToken,
    },
  } : {}),
});

module.exports = { router };
