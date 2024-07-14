const axios = require('axios');
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
require('dotenv').config();

if (!process.env.EMAIL_SERVICE_URL || !process.env.ERROR_EMAIL) {
  console.warn('Warning: email service not configured.');
}

const infoAndWarnFilter = format((info) =>
  info.level === 'info' || info.level === 'warn' ? info : false
);

class Logger {
  logger;

  webErrorLogger;

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

  error(message, data, email = true) {
    if (!this.logger) {
      throw new Error('Logger not initialized!');
    }

    this.logger.error(message, data);

    if (email) {
      this.emailError(message);
    }
  }

  webError(error) {
    this.webErrorLogger.error(error);
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

  async emailError(error) {
    try {
      await axios(process.env.EMAIL_SERVICE_URL, {
        method: 'post',
        data: {
          emailFrom: process.env.ERROR_EMAIL,
          emailTo: process.env.ERROR_EMAIL,
          subject: 'photo-gallery server error',
          text: error,
        },
      });
    } catch (e) {
      this.logger.error('Failed to send email', e);
    }
  }
}

module.exports = new Logger();
