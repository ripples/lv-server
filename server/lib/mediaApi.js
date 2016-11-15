"use strict";

const fetch = require("node-fetch");

const logger = require("./logger");

/**
 * Makes GET request to media server
 * @param {String} route - media server route to request
 * @return {Promise} - promise of result
 */
function request(route) {
  const requestUrl = encodeURI(`http://${process.env.MEDIA_HOSTNAME}:${process.env.MEDIA_SERVER_PORT}/${route}`);
  logger.info(`GET/ ${requestUrl}`);
  const headers = {
    "Content-Type": "application/json"
  };
  return new Promise((resolve, reject) => {
    let status = 0;
    fetch(requestUrl, "GET", headers)
      .then(response => {
        status = response.status;
        return response.json();
      })
      .then(data => {
        if (data.error) {
          let err = new Error(data.error);
          err.status = status == 404 ? 404 : 500;
          throw err;
        }
        resolve(data)
      })
      .catch(reject);
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
 * @param {String} courseId - course id
 * @param {String} lectureName - lecture name
 * @return {Promise} - promise of result
 */
function getLectureMetaData(semester, courseId, lectureName) {
  return request(`${semester}/${courseId}/${lectureName}`);
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
  getLectureData: getLectureData,
  getLectureMetaData: getLectureMetaData
};
