"use strict";

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const njwt = require("njwt");

const database = require("../lib/database");
const logger = require("../lib/logger");
const ERRORS = require("../lib/errors");

const SIGNING_KEY = process.env.SIGNING_KEY;

// login
router.post("/", (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  
  database.getIdAndHashFromEmail(email, (err, result) => {
    logger.info(`${email} attempting to authenticate`);
    if (err) {
      next(err);
    } else if (result.password) {
      // compare each hash to make sure the user is who they say they are
      bcrypt.compare(password, result.password, (err1, success) => {
        if (err1) {
          next(err1);
        } else if (success) {
          generateUserJwt(result.id, (err2, token) => {
            if (err2) {
              next(err2);
            } else {
              logger.info(`${email} successfully authenticated`);
              res.send({token: token});
            }
          });
        } else {
          // need to end the conection here, otherwise the error message is switched
          const code = 403;
          const message = ERRORS.LOGIN_EMAIL_PASS_FAILED;
          res.writeHead(code, message, {"content-type": "text/plain"});
          res.end(message);
        }
      });
    } else {
      res.sendStatus(401);
    }
  });
});

/**
 * Creates a JSON web token and send it to the user
 * @param {number} id - user id
 * @param {function} callback - JWT token
 */
function generateUserJwt(id, callback) {
  database.getCoursesFromUserId(id, (err, result) => {
    if (err) {
      callback(err);
    } else {
      const claims = {
        iss: "Lecture Viewer",
        sub: id,
        courses: result.map(course => {
          return {
            id: course.id,
            name: course.name
          };
        })
      };
      const jwt = njwt.create(claims, SIGNING_KEY);
      callback(null, jwt.compact());
    }
  });
}

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
