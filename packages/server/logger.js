const axios = require("axios");
const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
require("dotenv").config();

const infoAndWarnFilter = format((info) =>
  info.level === "info" || info.level === "warn" ? info : false
);

class Logger {
  logger;

  info(message, data) {
    if (!this.logger) {
      throw new Error("Logger not initialized!");
    }

    this.logger.info(message, data);
  }

  http(message, data) {
    if (!this.logger) {
      throw new Error("Logger not initialized!");
    }

    this.logger.http(message, data);
  }

  error(message, data, email = true) {
    if (!this.logger) {
      throw new Error("Logger not initialized!");
    }

    this.logger.error(message, data);

    if (email) {
      this.emailError(message);
    }
  }

  init(isServerLogger) {
    this.logger = createLogger({
      level: "http",
      format: format.combine(
        format.errors({ stack: true }),
        format.timestamp(),
        format.align(),
        format.printf(
          ({ level, message, timestamp, stack }) => `${timestamp} ${level}: ${message}${stack ? `\n${stack}` : ""}`
        )
      ),
      transports: isServerLogger
        ? [
            new transports.Console(),
            new transports.DailyRotateFile({
              filename: `./log/%DATE%-error.log`,
              level: "error",
              maxSize: "20m",
              maxFiles: "14d",
            }),
            new transports.DailyRotateFile({
              filename: `./log/%DATE%-info.log`,
              level: "info",
              maxSize: "20m",
              maxFiles: "14d",
              format: format.combine(infoAndWarnFilter(), format.timestamp()),
            }),
            new transports.DailyRotateFile({
              filename: `./log/%DATE%.log`,
              maxSize: "20m",
              maxFiles: "14d",
            }),
          ]
        : [new transports.Console()],
    });
  }

  async emailError(error) {
    try {
      await axios(process.env.EMAILSERVICEURL, {
        method: "post",
        data: {
          emailFrom: "kai452589@gmail.com",
          emailTo: "kai452589@gmail.com",
          subject: "photo-gallery server error",
          text: error,
        },
      });
    } catch (e) {
      this.logger.error(e, {});
    }
  }
}

module.exports = new Logger();
