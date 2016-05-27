"use strict";

var express = require('express');
var router = express.Router();
var bcrypt = require('bcryptjs');
var njwt = require('njwt');

var database = require('../utils/database');
var logger = require('../utils/logger');

var SIGNING_KEY = process.env.SIGNING_KEY;

// login
router.post('/', (req, res, next) => {
  var username = req.body.username;
  var unhashedPassword = req.body.password;

  hashString(unhashedPassword, (err, hashedPassword) => {
    if (err) {
      logger.error(err);
      next(err);
    } else {
      database.getHashedUserPassword(username, () => {});
      // compare each hash to make sure the user is who they say they are
      bcrypt.compare(unhashedPassword, hashedPassword, (err, success) => {
        if (err) {
          next(err);
        } else if (success) {

          // create a JSON web token and send it to the user
          // TODO currently returns fake classnames
          var claims = {
            iss: "Lecture Viewer",
            username: username,
            classnames: ['COMPSCI 326', 'COMPSCI 497']
          };
          var jwt = njwt.create(claims, SIGNING_KEY);
          var token = jwt.compact();
          res.send({
            token: token,
            username: username
          });

        } else {
          var err = new Error("Invalid email or password");
          err.status = 403;
          next(err);
        }
      });
    }
  });
});

/**
 * hashes a string and calls the callback with (err, hash)
 * @param {string} string - The string to hash
 * @param {function} callback - Called when exception or success; callback(err, hash)
 */
function hashString(string, callback) {
  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      callback(err);
    } else {
      bcrypt.hash(string, salt, (err, hash) => {
        if (err) {
          callback(err);
        } else {
          callback(undefined, hash);
        }
      });
    }
  });
}

module.exports = router;
