"use strict";

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const auth = require("./lib/auth");
const logger = require("./lib/logger");

const login = require("./routes/login");
const courses = require("./routes/courses");
const media = require("./routes/media");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

// unauthenticated routes
app.use("/api/v1/login", login);

// authenticated routes
app.use(auth);
app.use("/api/v1/courses", courses);
app.use("/api/v1/media", media);

// Error Handler
app.use((err, req, res, next) => {
  const status = err.status ? err.status : 500;

  if (status >= 400) {
    logger.error(`Request headers: ${JSON.stringify(req.headers)}`);
    logger.error(`Request parameters: ${JSON.stringify(req.params)}`);
  }

  if (status >= 500 || process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  let response = null;
  if (status >= 500) {
    response = {error: "Something went wrong"}
  } else {
    response = {error: err.message};
    if (err.data) {
      response.errors = err.data;
    }
  }

  res.status(status).json(response);
});


module.exports = app;
