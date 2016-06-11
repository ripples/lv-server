"use strict";

const http = require("http");

const httpAgent = new http.Agent({keepAlive: true});

const OPTIONS = {
  hostname: "lv-media",
  port: process.env.MEDIA_SERVER_PORT,
  agent: httpAgent
};

/**
 * GET lv-media/lectures
 * @param {string} courseName - course name
 * @param {function} success - callback on success
 * @param {function} failure - callback on failure
 */
function getLectures(courseName, success, failure) {
  const options = Object.assign(OPTIONS, {
    path: `${process.env.SEMESTER}/${courseName}`
  });

  const request = http.get(options, res => processData(res, success));
  request.setTimeout(500, () => {
    failure(`Request to ${options.port}/${options.path} timed out for course ${courseName}`);
  });
}

/**
 * Process lv-media request data
 * @param {object} res - response object
 * @param {function} success - callback on success
 */
function processData(res, success) {
  let data = "";

  res.on("data", chunk => {
    data += chunk;
  });

  res.on("end", () => {
    success(JSON.parse(data));
  });
}

module.exports = {
  getLectures: getLectures
};
