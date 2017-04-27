"use strict";

const mysql = require("mysql");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");

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
 * @param {Boolean} [many=false] - if many rows expected
 * @return {Promise<{data: *}> | undefined} - promise of result
 */
function query(query, args, many=false) {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        logger.error(err.message);
        return reject(err);
      }
      connection.query(query, args, (err, result) => {
        if (err) {
          return reject(err);
        }

        if (many) {
          result.data = _.map(result);
        } else {
          result.data = result[0];
        }
        resolve(result);
      });
      connection.release();
    });
  });
}

/**
 * Gets current semester id, start epoch and end epoch
 * @return {Promise<{data: {id: String, startEpoch: Number, endEpoch: Number}}>} - promise with current semester info
 */
function getCurrentSemesterInfo() {
  return new Promise((resolve, reject) => {
    if (currentSemester.endEpoch > new Date().getTime()) {
      resolve(currentSemester);
      return;
    }
    logger.info(`Current semester(${currentSemester.id}) cache of date is invalid with end date ${new Date(currentSemester.endEpoch)}, resolving to latest db entry`);
    query(queries["current-semester"]).then(result => {
      currentSemester = result.data;
      resolve(currentSemester);
    }).catch(reject);
  });
}

/**
 * Gets id and password from user email
 * @param {String} email - user email
 * @return {Promise<{data: {id: Number, password: String}}>} - promise with id and password
 */
function getIdAndHashFromEmail(email) {
  return new Promise((resolve, reject) => {
    query(queries["id-and-hash-from-email"], [email])
      .then(resolve)
      .catch(reject);
  });
}

/**
 * Gets course id and names for user
 * @param {Number} id - user id
 * @return {Promise<{data: Array<{id: Number, name: String}>}>} - promise with list of course info objects
 */
function getCoursesFromUserId(id) {
  return new Promise((resolve, reject) => {
    getCurrentSemesterInfo().then(semester => {
      query(queries["courses-from-user-id"], [id, semester.id], true)
        .then(resolve)
        .catch(reject);
    }).catch(reject);
  });
}

/**
 * Gets information for list of course ids
 * @param {Array.<Number>} courseIds - list of course ids
 * @return {Promise<{
 *    data: Array<{
 *      course_name: String,
 *      course_description: String,
 *      start_dtm: String,
 *      end_dtm: String,
 *      prof_fname: String,
 *      prof_lname: String,
 *      prof_email: String
 *    }>
 * }>} - promise of result
 */
function getCourseListMetaData(courseIds) {
  return new Promise((resolve, reject) => {
    query(queries["course-list-meta-data"], [courseIds, courseIds], true)
      .then(resolve)
      .catch(reject);
  });
}

/**
 * Sets password hash
 * @param {String} email - user email
 * @param {String} passwordHash - hashed password
 * @return {Promise<{data: *}>} - promise of result
 */
function updatePasswordHash(email, passwordHash) {
  return new Promise((resolve, reject) => {
    query(queries["update-password"], [passwordHash, email])
      .then(() => resolve({success: true}))
      .catch(reject);
  });
}

/**
 * Gets token hash id for given email
 * @param {String} email - user email
 * @return {Promise<{data: {id: Number} | undefined}>} - promise which will returned hash id for the given email
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
 * @return {Promise<{data: *}>} - promise of result
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
 * @return {Promise<{data: *}>} - promise of result
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
 * @return {Promise<{data: *}>} - promise of result
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
  getCurrentSemesterInfo,
  updatePasswordHash,
  getHashIdFromEmail,
  invalidateResetIdsForEmail,
  insertResetIdForEmail,
  invalidateResetIdForId
};
