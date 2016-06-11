"use strict";

const express = require("express");
const router = express.Router();
const http = require("http");

const database = require("../lib/database");
const logger = require("../lib/logger");

const httpAgent = new http.Agent({keepAlive: true});

// Return metadata of lecture
router.post("/:id", (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const courseName = req.body.courseName;

  logger.info(`${courseId}:${courseName} requested`);

  const options = {
    hostname: "lv-media",
    port: process.env.MEDIA_SERVER_PORT,
    path: `${process.env.SEMESTER}/${courseName}`,
    agent: httpAgent
  };

  const mediaRequest = new Promise((resolve, reject) => {
    const request = http.get(options, res => {
      let data = "";

      res.on("data", chunk => {
        data += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(data));
      });
    });
    request.setTimeout(500, () => {
      reject(`Request to
      ${options.port}/${options.path}/${courseId}:${options.port}
      timed out for course ${courseName}`);
    });
  });

  const metaDataRequest = new Promise((resolve, reject) => {
    database.getCourseMetaData(courseId, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });

  Promise.all([mediaRequest, metaDataRequest]).then(values => {
    const mediaResponse = values[0];
    const dbResponse = values[1];
    const response = {
      lectures: mediaResponse,
      description: dbResponse.course_description,
      prof: `${dbResponse.prof_fname} ${dbResponse.prof_lname}`,
      profEmail: dbResponse.prof_email,
      startDtm: dbResponse.start_dtm,
      endDtm: dbResponse.end_dtm
    };
    res.send(response);
  }, reason => {
    logger.error(reason);
  });
});

module.exports = router;
