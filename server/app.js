"use strict";

const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const useragent = require('express-useragent');

const auth = require("./libs/auth");
const logger = require("./libs/logger");
const errorHandler = require("./libs/errors/middleware");

const login = require("./routes/login");
const courses = require("./routes/courses");
const media = require("./routes/media");
const interalUsers = require("./routes/internal/users");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(useragent.express());
app.use(logger.requestLogger);

// unauthenticated routes
app.use("/api/v1/login", login);

// authenticated routes
app.use("/api/v1/courses", auth.middleware, courses);
app.use("/api/v1/media", auth.middleware, media);

// internal routes, should only be accessed by other docker containers defined by proxy rules
app.use("/internal/users", interalUsers);

// Error Handlers
app.use(logger.errorLogger);
app.use(errorHandler);

module.exports = app;
