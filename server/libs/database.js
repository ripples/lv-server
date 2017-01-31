"use strict";

const mysql = require("mysql");
const fs = require("fs");
const path = require("path");

const logger = require("./logger").logger;

const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOSTNAME,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DATABASE
});

const queries = loadQueries("./server/sql");
let currentSemester = {
  id: "",
  startEpoch: 0,
  endEpoch: 0
};

/**
 * Loads queries from given directory
 * @param {String} pathName - directory to load from
 * @return {Object} - map of queries
 */
function loadQueries(pathName) {
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
 * Returns promise of query
 * @param {String} query - sql query
 * @param {Array<*>} [args] - list of arguments
 * @return {Promise} - promise of result
 */
function query(query, args) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        logger.error(err.message);
        reject(err);
        return;
      }
      connection.query(query, args,
        (err, result) => {
          if (err) {
            reject(err);
          } else if (Object.keys(result).length === 1) {
            resolve(result[0])
          } else {
            resolve(result);
          }
        });
      connection.release();
    });
  });
}

/**
 * Gets current semester
 * @return {Promise<string>} - promise of result
 */
function getCurrentSemester() {
  return new Promise((resolve, reject) => {
    if (currentSemester.endEpoch > new Date().getTime()) {
      resolve(currentSemester.id);
      return;
    }
    logger.info(`Current semester(${currentSemester.id}) cache of date is invalid 
    with end date ${new Date(currentSemester.endEpoch)}, resolving to latest db entry`);
    query(queries["current-semester"]).then(result => {
      currentSemester = result;
      resolve(currentSemester.id);
    }).catch(reject);
  });
}

/**
 *
 * @param {String} email - user email
 * @return {Promise} - promise of result
 * success Object consists of one row, has structure:
 * [
 *  {
 *    id: number,
 *    password: string
 *  }
 * ]
 */
function getIdAndHashFromEmail(email) {
  return new Promise((resolve, reject) => {
    query(queries["id-and-hash-from-email"], [email])
      .then(resolve)
      .catch(reject);
  });
}

/**
 *
 * @param {Number} id - user id
 * @return {Promise} - promise of result
 * result Object consists of many rows, has structure:
 * [
 *  {
 *    id: number,
 *  },
 *  ...
 * ]
 */
function getCoursesFromUserId(id) {
  return new Promise((resolve, reject) => {
    getCurrentSemester().then(semester => {
      query(queries["courses-from-user-id"], [id, semester])
        .then(resolve)
        .catch(reject);
    }).catch(reject);
  });
}

/**
 *
 * @param {Array.<Number>} courseIds - list of course ids
 * @return {Promise} - promise of result
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
function getCourseListMetaData(courseIds) {
  return new Promise((resolve, reject) => {
    query(queries["course-list-meta-data"], [courseIds, courseIds])
      .then(resolve)
      .catch(reject);
  });
}

/**
 * Sets password hash
 * @param {String} email - user email
 * @param {String} passwordHash - hashed password
 * @return {Promise} - promise of result
 */
function updatePasswordHash(email, passwordHash) {
  return new Promise((resolve, reject) => {
    query(queries["update-password"], [passwordHash, email])
      .then(() => resolve({success: true}))
      .catch(reject);
  });
}

/**
 * Gets token hash for given email
 * @param {String} email - user email
 * @return {Promise} - promise of result
 */
function getHashIdFromEmail(email) {
  return new Promise((resolve, reject) => {
    query(queries["get-hash-id-from-email"], [email])
      .then(resolve)
      .catch(reject);
  });
}

/**
 * Invalidates all reset token ids for given email
 * @param {String} email - user email
 * @return {Promise} - promise of result
 */
function invalidateResetIdsForEmail(email) {
  return new Promise((resolve, reject) => {
    query(queries["invalidate-reset-ids-for-email"], [email])
      .then(resolve)
      .catch(reject);
  });
}

/**
 * Invalidates reset token has for given row id
 * @param {String} rowId - row id in db
 * @return {Promise} - promise of result
 */
function invalidateResetIdForId(rowId) {
  return new Promise((resolve, reject) => {
    query(queries["invalidate-reset-id-for-id"], [rowId])
      .then(resolve)
      .catch(reject);
  });
}


/**
 * Inserts a reset token hash for given email
 * @param {String} email - user email
 * @return {Promise} - promise of result
 */
function insertResetIdForEmail(email) {
  return new Promise((resolve, reject) => {
    query(queries["insert-reset-id-for-email"], [email])
      .then(resolve)
      .catch(reject);
  });
}

module.exports = {
  getCourseListMetaData,
  getIdAndHashFromEmail,
  getCoursesFromUserId,
  getCurrentSemester,
  updatePasswordHash,
  getHashIdFromEmail,
  invalidateResetIdsForEmail,
  insertResetIdForEmail,
  invalidateResetIdForId
};
