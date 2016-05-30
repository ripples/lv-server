"use strict";

const express = require('express');
const router = express.Router();
const http = require('http');

const database = require('../lib/database');
const logger = require('../lib/logger');

let httpAgent = new http.Agent({keepAlive: true});

// return a list of every lecture the user can view
router.post('/', (req, res, next) => {
  let courseId = parseInt(req.body.courseId);
  let courseName = req.body.courseName;

  let options = {
    hostname: "lv-media",
    port: process.env.MEDIA_SERVER_PORT,
    path: `${process.env.SEMESTER}/${courseName}`,
    agent: httpAgent
  };

  let mediaRequest = new Promise((resolve, reject) => {
    let request = http.get(options, res => {
      let data = "";

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(JSON.parse(data));
      });
    });
    request.setTimeout(500, () => {
      reject(`Request to lv-media/${options.path}:${options.port}
      timed out for course ${courseName} id: ${courseId}`);
    });
  });

  let metaDataRequest = new Promise((resolve, reject) => {
    database.getCourseMetaData(courseId, (err, result) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });

  Promise.all([mediaRequest, metaDataRequest]).then(values => {
    let mediaResponse = values[0];
    let dbResponse = values[1];
    let response = {
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
