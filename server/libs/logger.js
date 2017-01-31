"use strict";

const winston = require("winston");
const expressWinston = require("express-winston");

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      timestamp: true,
      prettyPrint: true,
      colorize: true,
      humanReadableUnhandledException: true
    })
  ]
});

const requestLogger = expressWinston.logger({
  transports: [
    new winston.transports.Console({
      json: false,
      timestamp: true,
      colorize: true
    })
  ],
  meta: false,
  msg: "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}",
  colorize: true
});

const errorLogger = expressWinston.errorLogger({
  transports: [
    new winston.transports.Console({
      json: true,
      timestamp: true,
      colorize: true
    })
  ]
});

module.exports = {
  logger,
  requestLogger,
  errorLogger
};
