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
app.use(logger.requestLogger);

// unauthenticated routes
app.use("/api/v1/login", login);

// authenticated routes
app.use("/api/v1/courses", auth.middleware, courses);
app.use("/api/v1/media", auth.middleware, media);

// Error Handlers
app.use(logger.errorLogger);
app.use((err, req, res, next) => {
  const status = err.status ? err.status : 500;
  let response = null;
  if (status >= 500) {
    response = {error: "Something went wrong"}
  } else {
    response = {error: err.message, data: err.data};
  }

  res.status(status).json(response);
});


module.exports = app;
