const dayjs = require('dayjs');
const winston = require('winston');

require('dotenv').config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.label({ label: 'server'}),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: `./log/${dayjs().format('YYYY-MM-DD_HHmmss')}-log.txt`,
    }),
  ],
});

module.exports = logger;