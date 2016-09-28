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

const queries = loadQueriesPromise("./server/sql");

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
 * @param {Object} err - error to be thrown
 * @param {Function} callback - Called on success or error returns (err, result)
 * @param {Object} result - result to be returned in callback
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
 * @param {String} email - user email
 * @param {Function} callback - Called on success or error returns (err, result)
 * result Object consists of one row, has structure:
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
 * @param {Number} id - user id
 * @param {Function} callback - Called on success or error returns (err, result)
 * result Object consists of many rows, has structure:
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
        [id, process.env.SEMESTER],
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
 * @param {Function} callback - Called on success or error returns (err, result)
 * result Object consists of many rows, has structure:
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

/**
 * @param {String} searchContent - string with the content to search
 * @oaram {String} userId - only search on te courses related to the user
 * @param {String} courseId - optional paramenter for the search - case == 0 search in all courses
 * @param {Function} callback - callback to execute when the query completes
 */
function getSearchResult(searchContent, userId, courseId = 0, callback) {
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error(err.message);
      callback(err);
    } else {
      connection.query(queries["search-feed-result"],
        [searchContent, searchContent, searchContent, userId],
        (err, result) => {
          handleResult(err, callback, result);
        });
    }
    connection.release();
  });
}

module.exports = {
  getCourseListMetaData: getCourseListMetaData,
  getIdAndHashFromEmail: getIdAndHashFromEmail,
  getCoursesFromUserId: getCoursesFromUserId,
  getSearchResult: getSearchResult
};
