"use strict";

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const auth = require('./lib/auth.js');
const routes = require('./routes/index');
const login = require('./routes/login');
const lectures = require('./routes/lectures');
const logger = require("./lib/logger");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// unauthenticated routes
app.use('/api/v1/login', login);

// authenticated routes
app.use(auth);
app.use('/', routes);
app.use('/api/v1/lectures', lectures);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res) => {
    res.status(err.status || 500);
    logger.error(err.message);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res) => {
  res.status(err.status || 500);
  logger.error(err.message);
  res.send({
    message: err.message,
    error: {}
  });
});

module.exports = app;
