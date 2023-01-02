const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

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

  error(message, data) {
    if (!this._logger) { throw new Error('Logger not initialized!'); }

    this._logger.error(message, data);
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
        }),
        new transports.DailyRotateFile({ 
          filename: `./log/%DATE%.log`,
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ] : [new transports.Console()],
    });
  }
}

module.exports = new Logger(); 