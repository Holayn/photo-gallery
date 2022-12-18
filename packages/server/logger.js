const dayjs = require('dayjs');
const { createLogger, format, transports } = require('winston');

require('dotenv').config();

class Logger {
  _logger;

  info(message, data) {
    if (!this._logger) { throw new Error('Logger not initialized!'); }

    this._logger.info(message, data);
  }

  init(isServerLogger) {
    this._logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(), 
        format.align(),
        format.printf(({ level, message, timestamp, ...meta }) => `${timestamp} ${level}: ${message}${Object.keys(meta).length ? ` - ${JSON.stringify(meta)}` : ''}`)
      ),
      transports: isServerLogger ? [
        new transports.Console(),
        new transports.File({
          filename: `./log/${dayjs().format('YYYY-MM-DD_HHmmss')}-error-log.txt`,
          level: 'error',
        }),
        new transports.File({ 
          filename: `./log/${dayjs().format('YYYY-MM-DD_HHmmss')}-log.txt`,
        }),
      ] : [new transports.Console()],
    });
  }
}

module.exports = new Logger(); 