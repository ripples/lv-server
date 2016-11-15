"use strict";

const router = require("express").Router();

const database = require("../lib/database");
const logger = require("../lib/logger");
const mediaApi = require("../lib/mediaApi");

/**
 * Serves meta data for course
 */

router.get("/", (req, res, next) => {
  const courses = req.user.courses;
  const courseIds = courses.map(course => course.id);

  logger.info(`[${courseIds}] requested by ${req.user.sub}`);

  if (courseIds.length == 0) {
    res.send({
      message: "User not enrolled in any courses"
    });
    return;
  }

  database.getCurrentSemester()
    .then(currentSemester => {
      let promises = [];
      courses.forEach(course => {
        promises.push(new Promise((resolve, reject) => {
          mediaApi.getLectures(currentSemester, course.id)
            .then(result => resolve({
              id: course.id,
              lectures: result
            }))
            .catch(reject);
        }));
      });

      promises.push(new Promise((resolve, reject) => {
        database.getCourseListMetaData(courseIds)
          .then(result => {
            if (!Array.isArray(result)) {
              result = [result];
            }
            resolve(result);
          })
          .catch(reject);
      }));

      Promise.all(promises)
        .then(values => {
          const dbResponse = values.pop();
          const response = values.map(mediaResponse => {
            const courseMetaData = dbResponse.find(courseMetaData => courseMetaData.id === mediaResponse.id);
            return {
              id: courseMetaData.id,
              name: courseMetaData.course_name,
              lectures: mediaResponse.lectures,
              description: courseMetaData.course_description,
              prof: `${courseMetaData.prof_fname} ${courseMetaData.prof_lname}`,
              profEmail: courseMetaData.prof_email,
              semester: courseMetaData.semester,
              startDtm: courseMetaData.semester_start_dtm,
              endDtm: courseMetaData.semester_end_dtm
            };
          });

          logger.info(`Successfully returned course meta data for courses: ${courseIds} to User: ${req.user.sub}`);
          res.send(response);
    }).catch(next);
  }).catch(next);
});

/**
 * Serves metadata for given lectures for course
 */
router.post("/:semester/:id", (req, res, next) => {
  const semester = req.params.semester;
  const courseId = req.params.id;
  const lectures = req.body.lectures;
  const course = req.user.courses.find(course => course.id === courseId);

  // User not registered to course
  if (!course) {
    logger.info(`Unauthorized access to ${courseId} lectures requested by ${req.user.sub}`);
    res.sendStatus(401);
    return;
  }

  if (!lectures) {
    res.sendStatus(400);
    return;
  }

  logger.info(`${courseId}:${course.name} lectures requested by ${req.user.sub}`);
  const promises = lectures.map(lecture => {
    return new Promise((resolve, reject) => {
      mediaApi.getLectureMetaData(semester, course.id, lecture)
        .then(result => resolve(result))
        .catch(reason => reject(reason));
    });
  });

  Promise.all(promises).then(values => {
    const response = values.map((lectureMetaData, i) => {
      return {
        name: lectures[i],
        data: lectureMetaData
      };
    });

    logger.info(`Successfully returned lecture meta data for course: ${courseId} to User: ${req.user.sub}`);

    res.send(response);
  }).catch(next);
});

module.exports = router;
