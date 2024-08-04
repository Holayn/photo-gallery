const axios = require('axios');
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
require('dotenv').config();

const ERROR_NOTIFICATION_DELAY_MS = 60 * 1000 * 5;

const infoAndWarnFilter = format((info) =>
  info.level === 'info' || info.level === 'warn' ? info : false
);

class Logger {
  logger;
  webErrorLogger;

  canSendServerErrorNotification = true;
  canSendWebErrorNotification = true;

  info(message, data) {
    if (!this.logger) {
      throw new Error('Logger not initialized!');
    }

    this.logger.info(message, data);
  }

  http(message, data) {
    if (!this.logger) {
      throw new Error('Logger not initialized!');
    }

    this.logger.http(message, data);
  }

  error(message, data, notify = false) {
    if (!this.logger) {
      throw new Error('Logger not initialized!');
    }

    this.logger.error(message, data);

    if (notify) {
      this.#sendServerErrorNotification();
    }
  }

  async webError(error) {
    this.webErrorLogger.error(error);
    this.#sendWebErrorNotification();
  }

  init(logToFile) {
    const loggerTransports = [new transports.Console()];

    if (logToFile) {
      loggerTransports.push(
        new transports.DailyRotateFile({
          filename: './log/%DATE%-error.log',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
        }),
        new transports.DailyRotateFile({
          filename: './log/%DATE%-info.log',
          level: 'info',
          maxSize: '20m',
          maxFiles: '14d',
          format: format.combine(infoAndWarnFilter(), format.timestamp()),
        }),
        new transports.DailyRotateFile({
          filename: './log/%DATE%.log',
          maxSize: '20m',
          maxFiles: '14d',
        })
      );
    }

    this.logger = createLogger({
      level: 'http',
      format: format.combine(
        format.errors({ stack: true }),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:SS' }),
        format.align(),
        format.printf(
          ({ level, message, timestamp, stack }) =>
            `${timestamp} ${level}: ${message}${stack ? `\n${stack}\n` : ''}`
        )
      ),
      transports: loggerTransports,
    });

    this.webErrorLogger = createLogger({
      format: format.combine(
        format.timestamp(),
        format.align(),
        format.printf(({ message, timestamp }) => `${timestamp}: ${message}`)
      ),
      transports: [
        new transports.Console(),
        new transports.DailyRotateFile({
          filename: './log/%DATE%-web-error.log',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });
  }

  async #sendServerErrorNotification() {
    if (!process.env.NOTIFY_URL) {
      this.logger.error('Notification service not configured.', null, false);
    }

    if (!this.canSendServerErrorNotification) {
      return;
    }

    try {
      await axios(process.env.NOTIFY_URL, {
        method: 'post',
        data: {
          message: 'photo-gallery server error',
        },
      });

      this.canSendServerErrorNotification = false;

      setTimeout(() => {
        this.canSendServerErrorNotification = true;
      }, ERROR_NOTIFICATION_DELAY_MS);
    } catch (e) {
      this.logger.error('Failed to send server error notification', e);
    }
  }

  async #sendWebErrorNotification() {
    if (!process.env.NOTIFY_URL) {
      this.logger.error('Notification service not configured.', null, false);
    }

    if (!this.canSendWebErrorNotification) {
      return;
    }

    try {
      await axios(process.env.NOTIFY_URL, {
        method: 'post',
        data: {
          message: 'photo-gallery web error',
        },
      });

      this.canSendWebErrorNotification = false;

      setTimeout(() => {
        this.canSendWebErrorNotification = true;
      }, ERROR_NOTIFICATION_DELAY_MS);
    } catch (e) {
      this.logger.error('Failed to send web error notification', e);
    }
  }
}

module.exports = new Logger();
