"use strict";

const router = require("express").Router();

const database = require("../lib/database");
const logger = require("../lib/logger");
const mediaApi = require("../lib/mediaApi");
const Errors = require("../lib/errors");

/**
 * Serves meta data for course
 */

router.get("/", (req, res, next) => {
  const courses = req.user.courses;
  const courseIds = courses.map(course => course.id);

  logger.info(`Courses requested by ${req.user.sub}`);

  let promises = [];
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
  }).catch(reason => {
    next(reason);
  });
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
      mediaApi.getLectureMetaData(semester, course.name, lecture, (err, result) => {
        if (err) {
          reject(err);
        }
        resolve({
          startTimestamp: result.timestamp,
          duration: result.duration,
          whiteboardCount: result.whiteboard_count,
          computerCount: result.computer_count
        });
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

    logger.info(`Successfully returned lecture meta data for course: ${courseId} to User: ${req.user.sub}`);

    res.send(response);
  }).catch(reason => {
    next(reason);
  });
});


/**
 * handles the request made on the feed section
 */


// this refers to how similar the keywords have to be from the values on the database
const RATIO = .6;

/**
 * generate a range of words to make the search
 * @param {String} keyWord
 * @returns {Array} - strings generated from the keyword
 */
function buildRegEx(keyWord) {
  //let words = [keyWord];
  let words = keyWord.split(" ");
  
  let mutations = [];
  // generate an array of mutations based on the user's keyword
  for (let word of words) {
    let wdlen = word.length;
    let chunkSize = wdlen * RATIO;
    for (let letter in word) {
      if ((chunkSize + parseFloat(letter)) > wdlen) {
        break;
      }
      let mystr = `${word.slice(letter, letter + chunkSize)}`;
      mutations.push(mystr.toLowerCase());
    }
    
  }
  words = words.concat(mutations, [keyWord]);
  return words.map(entry=>`%${entry}%`);
}

/**
 * post that handles the search for keywords on the feed section
 */
router.post("/search", (req, res, next) => {
  const keyWord = req.body.searchContent;
  // get the range of words to perform the search
  const words = buildRegEx(keyWord);
  let promises = [];
  words.forEach(word => {
    promises.push(new Promise((resolve, reject)=> {
      database.getSearchResult(word, req.user.sub, null, (err, result)=> {
        if (err) {
          reject(err);
        }
        if (!Array.isArray(result)) {
          result = [result];
        }
        resolve(result)
      })
    }));
  });
  let uniqueResults = [];
  // filter the reduntant results
  Promise.all(promises).then(values=> {
    values.forEach(entry=> {
      entry.forEach(el=> {
        if (!uniqueResults.find(match => match.course_id === el.course_id)) {
          uniqueResults.push(el);
        }
      });
    });
  }).then(()=> {
    // get the lectures for all the results found
    return Promise.all(uniqueResults.map(data=> {
      return new Promise((resolve, reject)=> {
        let courseName = data.course_name.toUpperCase();
        mediaApi.getLectures(courseName, (err, result)=> {
          if (err) {
            reject(err);
          }
          let wraper = {
            course_id: data.course_id,
            lectures: result
          };
          resolve(wraper);
        });
      });
    }));
  }).then(searchResults => {
    let response = searchResults.map(value=> {
      let courseData = uniqueResults.find((data)=> {
        return data.course_id === value.course_id;
      });
      return {
        id: courseData.course_id,
        name: courseData.course_name,
        lectures: value.lectures,
        description: courseData.course_description,
        prof: `${courseData.prof_fname} ${courseData.prof_lname}`,
        profEmail: courseData.prof_email,
        semester: courseData.semester,
        startDtm: courseData.semester_start_dtm,
        endDtm: courseData.semester_end_dtm
      }
    });
    logger.info(`Successfully returned result for keyword: ${keyWord}`);
    res.json(response);
  }).catch(reason=> {
    next(reason);
  });
});

module.exports = router;
