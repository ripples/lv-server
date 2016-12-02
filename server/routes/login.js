"use strict";

const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const njwt = require("njwt");
const crypto = require("crypto");

const database = require("../lib/database");
const logger = require("../lib/logger");
const errors = require("../lib/errors");
const mailer = require("../lib/mailer");

const SIGNING_KEY = process.env.SIGNING_KEY;

// login
router.post("/", (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  logger.info(`${email} attempting to authenticate`);
  database.getIdAndHashFromEmail(email).then(result => {
    verifyStringAgainstHash(password, result.password).then(() => {
      generateUserJwt(result.id).then(token => {
        logger.info(`${email} successfully authenticated`);
        res.send({token: token})
      });
    }).catch(() => {
      errors.sendError(errors.ERRORS.INVALID_AUTH_INFO, 401, next);
    });
  }).catch(next);
});

router.post("/forgot", (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    errors.sendError(errors.ERRORS.EMAIL_REQUIRED, 400, next);
    return;
  }
  database.invalidateResetHashesForEmail(email).then(() => {
    crypto.randomBytes(256, (err, tokenBuf) => {
      if (err) {
        return next(err);
      }
      const token = tokenBuf.toString('hex');
      hashString(token).then(hash => {
        database.insertResetHashForEmail(email, hash).then(() => {
          mailer.sendPasswordReset(email, token).then(() => {
            logger.info(`Successfully mailed reset token to ${email}`);
            res.send({
              message: "successfully sent email"
            });
          }).catch(next);
        }).catch(next);
      }).catch(next);
    });
  }).catch(next);
});

router.post("/reset", (req, res, next) => {
  const token = req.body.token;
  const email = req.body.email;
  const password = req.body.password;
  if (!email) {
    errors.sendError(errors.ERRORS.EMAIL_REQUIRED, 400, next);
    return;
  }
  database.getResetHashForEmail(email).then(result => {
    const rowId = result.id;
    const hash = result.hash;
    verifyStringAgainstHash(token, hash).then(() => {
      hashString(password).then(hash => {
        database.invalidateResetHashForId(rowId).then(() => {
          database.updatePasswordHash(email, hash).then(() => {
            logger.info(`${email} successfully reset password`);
            res.send({
              message: "success"
            });
          }).catch(next);
        }).catch(next);
      }).catch(next);
    }).catch(() => errors.sendError(errors.ERRORS.RESET_TOKEN_INVALID, 400, next))
  }).catch(next);
});

/**
 * Returns a JWT token containing a list of course names and ids
 * @param {number} id - user id
 * @return {Promise} - promise of result
 */
function generateUserJwt(id) {
  return new Promise((resolve, reject) => {
    database.getCoursesFromUserId(id).then(result => {
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
      resolve(njwt.create(claims, SIGNING_KEY).compact());
    }).catch(reject);
  });
}

/**
 * Hashes a string
 * @param {string} string - The string to hash
 * @return {Promise} - promise of result
 */
function hashString(string) {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        reject(err);
      } else {
        bcrypt.hash(string, salt, (err, hash) => {
          if (err) {
            reject(err);
          } else {
            resolve(hash);
          }
        });
      }
    });
  });
}

/**
 * Compares string and hash using bcrypt
 * @param {String} string - string to compare
 * @param {String} hash - hash
 * @return {Promise} - promise of result
 */
function verifyStringAgainstHash(string, hash) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(string, hash, (err, success) => {
      if (err || !success) {
        return reject(err);
      }
      resolve(success);
    });
  });
}

module.exports = router;
