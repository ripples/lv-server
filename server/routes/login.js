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

  logger.info(`${email} attempting to authenticate`);
  database.getIdAndHashFromEmail(email).then(result => {
    bcrypt.compare(password, result.password, (err1, success) => {
      if (err1) {
        next(err1);
      } else if (success) {
        generateUserJwt(result.id).then(token => {
          logger.info(`${email} successfully authenticated`);
          res.send({token: token})
        });
      } else {
        res.status(401).json({
          error: ERRORS.INVALID_AUTH_INFO
        });
      }
    });
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

module.exports = router;
