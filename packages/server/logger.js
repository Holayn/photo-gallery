const dayjs = require('dayjs');
const { createLogger, format, transports } = require('winston');

require('dotenv').config();

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
        format.timestamp(), 
        format.align(),
        format.printf(({ level, message, timestamp, ...meta }) => `${timestamp} ${level}: ${message}${Object.keys(meta).length ? ` - ${JSON.stringify(meta)}` : ''}`)
      ),
      transports: isServerLogger ? [
        new transports.Console(),
        new transports.File({
          filename: `./log/${dayjs().format('YYYY-MM-DD_HHmmss')}-error.log`,
          level: 'error',
        }),
        new transports.File({ 
          filename: `./log/${dayjs().format('YYYY-MM-DD_HHmmss')}.log`,
        }),
      ] : [new transports.Console()],
    });
  }
}

module.exports = new Logger(); 