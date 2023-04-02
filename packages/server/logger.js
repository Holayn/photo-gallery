const axios = require('axios');
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
require('dotenv').config();

const infoAndWarnFilter = format((info, opts) => {
  return info.level === "info" || info.level === "warn" ? info : false;
});

class Logger {
  _logger;

  info(message, data) {
    if (!this._logger) { throw new Error('Logger not initialized!'); }

    this._logger.info(message, data);
  }

  http(message, data) {
    if (!this._logger) { throw new Error('Logger not initialized!'); }

    this._logger.http(message, data);
  }

  error(message, data, email = true) {
    if (!this._logger) { throw new Error('Logger not initialized!'); }

    this._logger.error(message, data);

    if (email) {
      this._emailError(message);
    }
  }

  init(isServerLogger) {
    this._logger = createLogger({
      level: 'http',
      format: format.combine(
        format.errors({ stack: true }),
        format.timestamp(), 
        format.align(),
        format.printf(({ level, message, timestamp, stack, ...meta }) => {
          return `${timestamp} ${level}: ${message}${Object.keys(meta).length ? ` - ${JSON.stringify(meta)}` : ''}${stack ? `\n${stack}` : ''}`
        }),
      ),
      transports: isServerLogger ? [
        new transports.Console(),
        new transports.DailyRotateFile({
          filename: `./log/%DATE%-error.log`,
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
        }),
        new transports.DailyRotateFile({ 
          filename: `./log/%DATE%-info.log`,
          level: 'info',
          maxSize: '20m',
          maxFiles: '14d',
          format: format.combine(infoAndWarnFilter(), format.timestamp()),
        }),
        new transports.DailyRotateFile({ 
          filename: `./log/%DATE%.log`,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ] : [new transports.Console()],
    });
  }

  async _emailError(error) {
    try {
      await axios(process.env.EMAIL_SERVICE_URL, {
        method: 'post',
        data: {
          emailFrom: 'kai452589@gmail.com',
          emailTo: 'kai452589@gmail.com',
          subject: 'photo-gallery server error',
          text: error,
        },
      });
    } catch (e) {
      this._logger.error(e, {}, false);
    }
  }
}

module.exports = new Logger(); 