"use strict";

const njwt = require("njwt");

const errors = require("../lib/errors");

const SIGNING_KEY = process.env.SIGNING_KEY;

// Auth middleware:
module.exports = (req, res, next) => {
  var token = req.headers.authorization;
  if (token) {
    njwt.verify(token, SIGNING_KEY, (err, ver) => {
      if (err) {
        // token is expired
        return errors.sendError(errors.ERRORS.TOKEN_EXPIRED, 401, next);
      } else {
        // token is Gucci!
        req.user = ver.body;
      }
    });
  } else {
    return errors.sendError(errors.ERRORS.UNAUTHORIZED_ACCESS, 401, next);
  }
};
