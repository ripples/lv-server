"use strict";

var njwt = require("njwt");

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
        sendError("Token is expired.", 401, next);
      } else {
        // token is Gucci!
        req.user = ver.body;
        next();
      }
    });
  } else {
    // token not sent
    sendError("Token was not received. Expected token in Authorization header.", 401, next);
  }
};
