"use strict";

/**
 * Feed route: handles the request made on the feed section
 */

const router = require("express").Router();

const database = require("../lib/database");
const mediaAPI = require("../lib/mediaApi");
const logger = require("../lib/logger");

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
        mediaAPI.getLectures(courseName, (err, result)=> {
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
