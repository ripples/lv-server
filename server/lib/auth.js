"use strict";

var njwt = require("njwt");
const ERRORS = require("../lib/errors");

var SIGNING_KEY = process.env.SIGNING_KEY;

var sendError = (message, status, next) => {
  var err = new Error(message);
  err.status = status;
  next(err);
};

// Accepted Header:
//    Authorization: YOUR_TOKEN_HERE
module.exports = (req, res, next) => {
  var token = req.headers.authorization;
  if (token) {
    njwt.verify(token, SIGNING_KEY, (err, ver) => {
      if (err) {
        // token is expired
        const message = ERRORS.TOKEN_EXPIRED;
        const code = 401;
        res.writeHead(code, message, {"content-type": "text/plain"});
        res.end(message); // need to end the conection here, otherwise the error message is switched
      } else {
        // token is Gucci!
        req.user = ver.body;
        next();
      }
    });
  } else {
    // token not sent
    sendError(ERRORS.TOKEN_NOT_RECEIVED, 401, next);
  }
};
