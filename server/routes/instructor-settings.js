"use strict";

const router = require("express").Router();
const _ = require("lodash");
const database = require("../libs/database");
const logger = require("../libs/logger").logger;

router.get("/", (req, res, next) => {
  logger.info("Hitting Instructor Settings Route");
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
    logger.info("Returning", JSON.stringify(info, null, "\t"));
    res.send(info);
  });
});

module.exports = router;
