"use strict";

const router = require("express").Router();
const co = require("co");
const _ = require("lodash");

const database = require("../libs/database");
const logger = require("../libs/logger").logger;
const mediaApi = require("../libs/mediaApi");

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

  co(function* () {
    const currentSemester = yield database.getCurrentSemester();
    const values = yield Promise.all([
      ...yield courses.map(function* (course) {
        return {
          id: course.id,
          lectures: yield mediaApi.getLectures(currentSemester, course.id)
        }
      }),
      yield database.getCourseListMetaData(courseIds)
    ]);
    const dbResponse = _.castArray(values.pop());
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
    res.send(response);
  }).catch(next);
});

module.exports = router;
