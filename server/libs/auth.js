"use strict";

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const moment = require("moment");

const errors = require("./errors/errors");
const database = require("./database");

const SIGNING_KEY = process.env.SIGNING_KEY;


function middleware(req, res, next) {
  const token = req.cookies["ripples-lv"];
  if (!token) {
    throw new errors.UnauthorizedAccess();
  }
  jwt.verify(token, SIGNING_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
    if (err) {
      //TODO: handle each jwt error
      throw new errors.JwtTokenExpired();
    } else {
      req.user = decodedToken;
      next();
    }
  });
}

// TODO: throw error
function unHashJwtToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, SIGNING_KEY, (err, decodedToken) => {
      if (err) {
        //TODO: handle each jwt error
        throw new errors.JwtTokenExpired();
      }
      resolve(decodedToken);
    });
  })
}

/**
 * Returns a JWT token containing the user email
 * @param {String} email - user email
 * @param {Number} id - token id
 * @param {Number} [validFor=2] - length of validity of token in {@link generateEmailJwt.unit}
 * @param {moment.DurationInputArg2} [unit="hours"] - length of validity of token in hours
 * @return {String} - jwt token
 */
function generateEmailJwt(email, id, validFor=2, unit="hours") {
  const claims = {
    iss: "Lecture Viewer",
    sub: email,
    tokenId: id,
    exp: moment.utc().add(moment.duration(validFor, unit)).valueOf()
  };
  return _createJwtToken(claims);
}

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
      resolve(_createJwtToken(claims));
    }).catch(reject);
  });
}

/**
 * Hashes a string
 * @param {string} string - The string to hash
 * @return {Promise<string>} - promise of result
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

function _createJwtToken(claims) {
  return jwt.sign(claims, SIGNING_KEY);
}

module.exports = {
  middleware,
  unHashJwtToken,
  generateEmailJwt,
  generateUserJwt,
  hashString,
  verifyStringAgainstHash
};
