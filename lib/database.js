"use strict";

const mysql = require("mysql");
const fs = require("fs");
const path = require("path");

const logger = require("./logger");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOSTNAME,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

const queries = loadQueriesPromise("sql");

/**
 * Loads queries from given directory
 * @param {String} pathName - directory to load from
 * @return {Object} - map of queries
 */
function loadQueriesPromise(pathName) {
  const queries = {};
  fs.readdir(pathName, (err, files) => {
    if (err) {
      logger.error(err);
      return;
    }
    const promises = files.map(fileName => {
      return new Promise(resolve => {
        fs.readFile(path.join(pathName, fileName), (err, sql) => {
          if (err) {
            logger.error(err);
          } else {
            queries[fileName.replace(".sql", "")] = sql.toString();
          }
          resolve();
        });
      });
    });

    Promise.all(promises).then(() => {
      logger.info(`Loaded SQL queries: ${Object.keys(queries).join(", ")}`);
    });
  });
  return queries;
}

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
      console.log(queries);
      connection.query(queries["id-and-hash-from-email"],
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
      connection.query(queries["courses-from-user-id"],
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
      connection.query(queries["course-list-meta-data"],
        [courseIds, courseIds],
        (err, result) => {
          handleResult(err, callback, result);
          connection.release();
        });
    }
  });
}

module.exports = {
  getCourseListMetaData: getCourseListMetaData,
  getIdAndHashFromEmail: getIdAndHashFromEmail,
  getCoursesFromUserId: getCoursesFromUserId
};
