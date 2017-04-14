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
  const userTypesCourses = req.user.userTypesCourses;
  const courseIds = _.flatMap(userTypesCourses, userType => userType.map(course => course.id));
  const courseToUserTypeId = _.transform(userTypesCourses, (result, userType, userTypeId) => {
    userType.forEach(course => result[course.id] = userTypeId);
    return result;
  }, {});

  if (courseIds.length == 0) {
    res.send({
      message: "User not enrolled nor professes any courses"
    });
    return;
  }

  co(function* () {
    const currentSemester = yield database.getCurrentSemester();
    const values = yield Promise.all([
      ...yield courseIds.map(function* (id) {
        return {
          id,
          lectures: yield mediaApi.getLectures(currentSemester, id)
        }
      }),
      yield database.getCourseListMetaData(courseIds),
    ]);
    const dbResponse = _.castArray(values.pop());
    let response = _.mapValues(userTypesCourses, () => {return {};});
    values.forEach(mediaResponse => {
      const courseMetaData = dbResponse.find(courseMetaData => courseMetaData.id === mediaResponse.id);
      const userTypeId = courseToUserTypeId[courseMetaData.id];

      response[userTypeId][courseMetaData.id] = {
        id: courseMetaData.id,
        title: courseMetaData.id, // should be courseMetaData.course_name but we don't have the data right now
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

router.get("/instructor-settings", (req, res, next) => {
  const userTypesCourses = req.user.userTypesCourses;
  const courseIds = _.flatMap(userTypesCourses, userType => userType.map(course => course.id));

  var info = courseIds.map(course => {
    return {
      course_id: course,
      course_name: course,
      students: []
    }
  });
  database.instructorCoursesUsers(courseIds).then( students => {
    students.map( student => {
      //re is unused, but the map function just stops if I don't tell it to assign to something...
      let re = info.find( element => {return element.course_id === student.course_id}).students.push(
        {
          fname: "Timothy",
          lname: "Tebow",
          email: student.email,
          user_id: student.user_id,
          user_type_id: student.user_type_id,
          user_type_name: student.user_type_name
        }
      );
    });
    res.send(info);
  });
});

module.exports = router;
