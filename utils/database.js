"use strict";

var mysql = require('mysql');
var logger = require('./logger');

var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'db',
  user: 'root',
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

/**
 *
 * @param {object} err - error to be thrown
 * @param {function} callback - Called on success or error returns (err, result)
 * @param {object} result - result to be returned in callback
 */
function handleResult(err, callback, result) {
  if (err) {
    logger.error(err.message);
    callback(err);
  } else {
    if (result.length === 1) {
      callback(null, result[0]);
    } else {
      callback(null, result);
    }
  }
}

/**
 *
 * @param {string} email - user email
 * @param {function} callback - Called on success or error returns (err, result)
 * result object consists of one row, has structure:
 * [
 *  {
 *    id: number,
 *    password: string
 *  }
 * ]
 */
function getIdAndHashFromEmail(email, callback) {
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error(err.message);
      callback(err);
    } else {
      connection.query("SELECT id, password FROM users WHERE email=?",
        [email],
        (err, result) => {
          handleResult(err, callback, result);
          connection.release();
        });
    }
  });
}

/**
 *
 * @param {number} id - user id
 * @param {function} callback - Called on success or error returns (err, result)
 * result object consists of many rows, has structure:
 * [
 *  {
 *    name: string,
 *    description: string
 *  },
 *  ...
 * ]
 */
function getCoursesFromId(id, callback) {
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error(err.message);
      callback(err);
    } else {
      connection.query("SELECT name, description FROM " +
        "courses c INNER JOIN lkp_course_users lcu ON c.id = lcu.course_id " +
        "WHERE lcu.user_id = ?",
        [id],
        (err, result) => {
          handleResult(err, callback, result);
          connection.release();
        });
    }
  });
}

module.exports.getIdAndHashFromEmail = getIdAndHashFromEmail;
module.exports.getCoursesFromId = getCoursesFromId;
