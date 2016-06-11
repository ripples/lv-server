"use strict";

const mysql = require("mysql");

const logger = require("./logger");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOSTNAME,
  user: process.env.MYSQL_USER,
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
  } else if (result.length === 1) {
    callback(null, result[0]);
  } else {
    callback(null, result);
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
 *    id: number,
 *  },
 *  ...
 * ]
 */
function getCoursesFromUserId(id, callback) {
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error(err.message);
      callback(err);
    } else {
      connection.query("SELECT " +
        "c.id, c.name, c.description, c.start_dtm, c.end_dtm " +
        "FROM courses c " +
        "INNER JOIN lkp_course_users lcu ON c.id = lcu.course_id " +
        "WHERE lcu.user_id = ?",
        [id],
        (err, result) => {
          handleResult(err, callback, result);
          connection.release();
        });
    }
  });
}

/**
 *
 * @param {Array.<Number>} courseIds - list of course ids
 * @param {function} callback - Called on success or error returns (err, result)
 * result object consists of many rows, has structure:
 * [
 *  {
 *    course_name: string,
 *    course_description: string,
 *    start_dtm: string,
 *    end_dtm: string,
 *    prof_fname: string,
 *    prof_lname: string,
 *    prof_email: string
 *  },
 *  ...
 * ]
 */
function getCourseListMetaData(courseIds, callback) {
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error(err.message);
      callback(err);
    } else {
      connection.query("SELECT c.id as id, c.name as course_name, " +
        "c.description as course_description, c.start_dtm, c.end_dtm, " +
        "prof.fname as prof_fname, prof.lname as prof_lname, " +
        "prof.email as prof_email " +
        "FROM courses c INNER JOIN " +
          "( SELECT u.fname, u.lname, u.email, lcu.course_id " +
          "FROM lkp_course_users lcu " +
          "INNER JOIN users u ON u.id = lcu.user_id " +
          "WHERE u.user_type_id = 3 AND lcu.course_id IN (?) " +
        ") prof " +
        "ON prof.course_id = c.id WHERE c.id IN (?)",
        [courseIds, courseIds],
        (err, result) => {
          handleResult(err, callback, result);
          connection.release();
        });
    }
  });
}

module.exports.getCourseListMetaData = getCourseListMetaData;
module.exports.getIdAndHashFromEmail = getIdAndHashFromEmail;
module.exports.getCoursesFromUserId = getCoursesFromUserId;
