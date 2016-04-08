var express = require('express');
var router = express.Router();
var filescraper = require('../lib/filescraper');
var MEDIA_DIR = require('../config.json').MEDIA_DIR;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Hi!');
});

/* GET file structure. */
router.get('/fs', function(req, res, next) {
  filescraper.diretoryTreeToObj(MEDIA_DIR, function(err, tree) {
      if(err) console.error(err);
      res.send(JSON.stringify(tree));
  });
});

module.exports = router;
