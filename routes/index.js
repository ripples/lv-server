var express = require('express');
var router = express.Router();
var filescraper = require('../lib/filescraper');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send('Hi!');
});

/* GET file structure. */
router.get('/fs', function(req, res, next) {
  var dirTree = ('.');

  filescraper.diretoryTreeToObj(dirTree, function(err, tree) {
      if(err) console.error(err);
      res.send(JSON.stringify(tree));
  });
});

module.exports = router;
