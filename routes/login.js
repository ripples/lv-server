var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt-nodejs');
var njwt = require('njwt');
var SIGNING_KEY = process.env.SIGNING_KEY;

// login
router.post('/', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;

  // TODO instead of querying for user, fake it for now
  var unhashedPasswordInDatabase = 'lvadmin';
  hashString(unhashedPasswordInDatabase, function(err, hashedPasswordInDatabase) {
    if(err) {
      next(err);
    } else {

      // compare each hash to make sure the user is who they say they are
      bcrypt.compare(password, hashedPasswordInDatabase, function(err, success) {
        if(err) {
          next(err);
        } else if(success) {

          // create a JSON web token and send it to the user
          var claims = {
            iss: "Lecture Viewer",
            username: username
          };
          var jwt = njwt.create(claims, SIGNING_KEY);
          var token = jwt.compact();
          res.send({
            token: token,
            username: username
          });

        } else {
          var err = new Error("Invalid email or password");
          err.status = 403;
          next(err);
        }
      });
    }
  });
});

// hashes a string and calls the callback with (err, hash)
function hashString(string, callback) {
  bcrypt.genSalt(10, function(err, salt) {
    if(err) {
      callback(err);
    } else {
      bcrypt.hash(string, salt, null, function(err, hash) {
        if(err) {
          callback(err);
        } else {
          callback(undefined, hash);
        }
      });
    }
  });
}

module.exports = router;
