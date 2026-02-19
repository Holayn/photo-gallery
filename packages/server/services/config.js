require('dotenv').config();

const env = process.env.ENV || 'production';

if (!['development', 'production'].includes(env)) {
  throw new Error('ENV must be "development" or "production".');
}
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET not defined in .env!');
}
if (env !== 'development' && !process.env.FILES_PATH) {
  throw new Error('FILES_PATH not defined in .env!');
}

module.exports = Object.freeze({
  env,
  isDevelopment: env === 'development',
  port: Number(process.env.PORT) || 8000,
  baseUrl: process.env.BASE_URL || '',
  sessionSecret: process.env.SESSION_SECRET,
  notifyUrl: process.env.NOTIFY_URL,
  filesPath: process.env.FILES_PATH,
  disableNginxRedirect: process.env.DISABLE_NGINX_REDIRECT === 'true',
});
