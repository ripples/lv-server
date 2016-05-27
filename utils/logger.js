"use strict";

var winston = require('winston');
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');

var logger = new winston.Logger({
  transports: [
    new winston.transports.DailyRotateFile({
      filename: './logs/log.log',
      handleExceptions: true,
      prettyPrint: true,
      json: false,
      maxsize: 5000000,
      maxFiles: 5
    }),
    new winston.transports.Console({
      handleExceptions: true,
      timestamp: true,
      prettyPrint: true,
      colorize: true,
      humanReadableUnhandledException: true
    })
  ]
});

module.exports = logger;
