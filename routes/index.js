"use strict";

var express = require('express');
var router = express.Router();
var filescraper = require('../lib/filescraper');
// if no media directory is specified, use /media
var MEDIA_DIR = (process.env.MEDIA_DIR || '/media');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Hi!');
});

/* GET file structure. */
router.get('/fs', function(req, res, next) {
  filescraper.directoryTreeToObj(MEDIA_DIR, function(err, tree) {
      if(err) console.error(err);
      res.send(JSON.stringify(tree));
  });
});

router.get('/folders', function(req, res, next) {
  filescraper.directoryTreeFolders(MEDIA_DIR, function(err,tree) {
    if (err) console.error(err);
    res.send(JSON.stringify(tree));
  });
});

router.get('/files', function(req,res,next) {
  filescraper.directoryTreeFolders(MEDIA_DIR, function(err,tree) {
    if (err) console.error(err);
    res.send(JSON.stringify(tree));
  });
});

module.exports = router;
