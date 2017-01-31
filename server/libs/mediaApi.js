"use strict";

const fetch = require("node-fetch");
const co = require("co");

const logger = require("./logger").logger;

/**
 * Makes GET request to media server
 * @param {String} route - media server route to request
 * @return {Promise} - promise of result
 */
function request(route) {
  const requestUrl = encodeURI(`http://${process.env.MEDIA_HOSTNAME}:${process.env.MEDIA_SERVER_PORT}/${route}`);
  logger.info(`GET/ ${requestUrl}`);
  return co(function* () {
    const response = yield fetch(requestUrl, "GET", {
      "Content-Type": "application/json"
    });
    const status = response.status;
    const data = yield response.json();
    if (data.error) {
      let err = new Error(data.error);
      err.status = status == 404 ? 404 : 500;
      throw err;
    }
  });
}

/**
 * GET lv-media/course
 * @param {String} currentSemester - current semester
 * @param {String} courseId - course name
 * @return {Promise} - promise of result
 */
function getLectures(currentSemester, courseId) {
  return request(`${currentSemester}/${courseId}`);
}


/**
 * GET lv-media/course/lectures
 * @param {String} semester - semester
 * @param {String} courseId - course name
 * @param {String} lectureName - lecture name
 * @return {Promise} - promise of result
 */
function getLectureData(semester, courseId, lectureName) {
  return request(`${semester}/${courseId}/${lectureName}/data`);
}

module.exports = {
  getLectures: getLectures,
  getLectureData: getLectureData
};
