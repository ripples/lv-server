var njwt = require('njwt');
var SIGNING_KEY = process.env.SIGNING_KEY;

var sendError = function(message, status, next) {
  var err = new Error(message);
  err.status = status;
  next(err);
}

// Accepted Header:
//    Authorization: YOUR_TOKEN_HERE
module.exports = function(req, res, next) {
  var token = req.headers.authorization;
  if(!token) {
    // token not sent
    sendError("Token was not recieved.\nExpected token in 'Authorization' header with format: 'Token YOUR_TOKEN_HERE'", 401, next);
  } else {
    njwt.verify(token, SIGNING_KEY, function(err, ver) {
      if(err) {
        // token is expired
        sendError("Token is expired.'", 401, next);
      } else {
        // token is Gucci!
        req.user = ver.body;
        next();
      }
    });
  }
}
