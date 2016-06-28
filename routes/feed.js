"use strict";
/**
 * Feed route: handles the request made on the feed section
 */

const router = require('express').Router();
const path = require("path");

const database = require("../lib/database");
const logger = require("../lib/logger");

/**
 * PS: this method is not completed yet. Need to figure out how to perform the search correctly.
 * so far it only returns the courses the user writes on the search
 * post that handles the search for keywords on the feed section
 */
router.post("/search", (req, res, next)=> {
  const keyWord = req.body.searchContent;
  database.getSearchResult(keyWord, null, (err, result)=> {
    if (err) {
      next(err);
    }
    if (!Array.isArray(result)) {
      result = [result];
    }
    logger.info(`Successfully returned result for keyword: ${keyWord}`);
    res.send(result);
  });
});

module.exports = router;