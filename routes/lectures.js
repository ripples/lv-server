"use strict";

var express = require('express');
var router = express.Router();

// return a list of every lecture the user can view
router.post('/', function(req, res, next) {
  var classIds = req.user.classIds;
  // TODO using classnames, find a list of lectures that the user is in

  var fakeData = [
    { classname : 'COMPSCI 497', date : '10/14/15' },
    { classname : 'COMPSCI 326', date : '10/13/15' },
    { classname : 'COMPSCI 497', date : '10/11/15' }
  ];
  res.send(fakeData);
});

module.exports = router;
