"use strict";

const http = require("http");

const logger = require("./logger");

const httpAgent = new http.Agent({keepAlive: true});

const OPTIONS = {
  hostname: "lv-media",
  port: process.env.MEDIA_SERVER_PORT,
  agent: httpAgent
};

/**
 * Process lv-media request data
 * @param {Object} res - response object
 * @param {Function} complete - callback on completion
 */
function processData(res, complete) {
  let data = "";

  res.on("data", chunk => {
    data += chunk;
  });

  res.on("end", () => {
    complete(JSON.parse(data));
  });
}

/**
 * GET lv-media/course
 * @param {String} courseName - course name
 * @param {Function} callback - callback result, called as callback(err, result)
 */
function getLectures(courseName, callback) {
  const options = Object.assign(OPTIONS, {
    path: `${process.env.SEMESTER}/${courseName}`
  });
  logger.info(`GET/ ${options.path}`);
  const request = http.get(options, res => processData(res, data => callback(null, data)));
  request.setTimeout(5000, () => {
    callback(`Request to ${options.hostname}/${options.path} timed out`);
  });
}

/**
 * GET lv-media/course/lectures
 * @param {String} semester - semester
 * @param {String} courseName - course name
 * @param {String} lectureName - lecture name
 * @param {Function} callback - callback result, called as callback(err, result)
 */
function getLectureMetaData(semester, courseName, lectureName, callback) {
  const options = Object.assign(OPTIONS, {
    path: `${semester}/${courseName}/${lectureName}`
  });

  const require = http.get(options, res => processData(res, data => callback(null, data)));
  require.setTimeout(5000, () => {
    callback(`Request to ${options.hostname}/${options.path} timed out`);
  });
}

/**
 * GET lv-media/course/lectures
 * @param {String} semester - semester
 * @param {String} courseName - course name
 * @param {String} lectureName - lecture name
 * @param {Function} callback - callback result, called as callback(err, result)
 */
function getLectureData(semester, courseName, lectureName, callback) {
  const options = Object.assign(OPTIONS, {
    path: `${semester}/${courseName}/${lectureName}/data`
  });

  const require = http.get(options, res => processData(res, data => callback(null, data)));
  require.setTimeout(5000, () => {
    callback(`Request to ${options.hostname}/${options.path} timed out`);
  });
}

module.exports = {
  getLectures: getLectures,
  getLectureData: getLectureData,
  getLectureMetaData: getLectureMetaData
};
