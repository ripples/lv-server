"use strict";

const router = require("express").Router();
const path = require("path");

const database = require("../lib/database");
const logger = require("../lib/logger");
const mediaApi = require("../lib/mediaApi");

/**
 * Serves meta data for course
 */
router.get("/", (req, res, next) => {
  const courses = req.user.courses;
  const courseIds = courses.map(course => course.id);

  logger.info(`Courses requested by ${req.user.sub}`);

  const promises = [];
  courses.forEach(course => {
    promises.push(new Promise((resolve, reject) => {
      mediaApi.getLectures(course.name, (err, result) => {
        if (err) {
          reject(err);
        }
        const wrapper = {
          id: course.id,
          lectures: result
        };
        resolve(wrapper);
      });
    }));
  });

  promises.push(new Promise((resolve, reject) => {
    database.getCourseListMetaData(courseIds, (err, result) => {
      if (err) {
        reject(err);
      }

      if (!Array.isArray(result)) {
        result = [result];
      }

      resolve(result);
    });
  }));

  Promise.all(promises).then(values => {
    const dbResponse = values.pop();
    const response = values.map(mediaResponse => {
      const courseMetaData = dbResponse.find(courseMetaData => courseMetaData.id === mediaResponse.id);
      return {
        id: courseMetaData.id,
        lectures: mediaResponse.lectures,
        metaData: {
          description: courseMetaData.course_description,
          prof: `${courseMetaData.prof_fname} ${courseMetaData.prof_lname}`,
          profEmail: courseMetaData.prof_email,
          startDtm: courseMetaData.start_dtm,
          endDtm: courseMetaData.end_dtm
        }
      };
    });

    logger.info(`Successfully returned course meta data for courses: ${courseIds} to User: ${req.user.sub}`);

    res.send(response);
  }, reason => {
    next(reason);
  });
});

/**
 * Serves metadata for given lectures for course
 */
router.post("/:id", (req, res, next) => {
  const courseId = parseInt(req.params.courseId, 10);
  const lectures = req.body.lectures;
  const course = req.user.courses.find(course => course.id === courseId);

  // User not registered to course
  if (!course) {
    res.sendStatus(401);
  }

  logger.info(`${courseId}:${course.name} lectures requested by ${req.user.sub}`);
  const promises = lectures.map(lecture => {
    return new Promise((resolve, reject) => {
      mediaApi.getLecture(course.name, lecture, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    });
  });

  Promise.all(promises).then(values => {
    const response = values.map((lectureMetaData, i) => {
      return {
        name: lectures[i],
        data: lectureMetaData
      };
    });

    logger.info(`Successfully returned lecture meta data for cours: ${courseId} to User: ${req.user.sub}`);

    res.send(response);
  }, reason => {
    next(reason);
  });
});

/**
 *  Serves authenticated media via lv-proxy
 */
router.get("/:id/:lecture", (req, res, next) => {
  const courseId = parseInt(req.params.courseId, 10);
  const lectureName = parseInt(req.params.lecture, 10);
  const course = req.user.courses.find(course => course.id === courseId);

  // User not registered to course
  if (!course) {
    res.sendStatus(401);
  }
  logger.info(`Lecture: ${lectureName} requested for ${courseId}:${course.name} requested by ${req.user.sub}`);

  const mediaPath = path.join("/api", process.env.MEDIA_DIR, `${course.name}`, `${lectureName}`, "test.mp4");

  res.writeHead(200, {
    "X-Accel-Redirect": mediaPath
  });
  res.end();
});

module.exports = router;
