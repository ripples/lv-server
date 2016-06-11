"use strict";

const router = require("express").Router();

const database = require("../lib/database");
const logger = require("../lib/logger");
const mediaApi = require("../lib/mediaApi");

/**
 * Return courses list for user
 */
router.post("/", (req, res, next) => {
  const courseIds = req.user.courses.map(course => course.id);

  logger.info(`User: ${req.user.sub} requested course meta data for courses: ${courseIds}`);

  database.getCourseListMetaData(courseIds, (err, result) => {
    if (err) {
      next(err);
    }

    if (!Array.isArray(result)) {
      result = [result];
    }

    logger.info(`Successfully returned course meta data for courses: ${courseIds} to User: ${req.user.sub}`);
    res.send(result);
  });
});

/**
 * Return lectures list for course
 */
router.post("/:id", (req, res, next) => {
  const courseId = parseInt(req.params.courseId, 10);
  const courseName = req.user.courses.find(course => course.id === courseId);

  // User not registered to course
  if (!courseName) {
    res.sendStatus(401);
  }

  logger.info(`${courseId}:${courseName} requested`);

  const mediaRequest = new Promise((resolve, reject) => {
    mediaApi.getLectures(courseName, resolve, reject);
  });

  const metaDataRequest = new Promise((resolve, reject) => {
    database.getCourseListMetaData([courseId], (err, result) => {
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
    next(reason);
  });
});

module.exports = router;
