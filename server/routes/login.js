"use strict";

const express = require("express");
const router = express.Router();
const co = require("co");
const util = require("util");
const moment = require("moment");

const database = require("../libs/database");
const logger = require("../libs/logger").logger;
const errors = require("../libs/errors");
const mailer = require("../libs/mailer");
const auth = require("../libs/auth");


// login
router.post("/", (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    return errors.sendError(errors.ERRORS.EMAIL_REQUIRED, next);
  }

  logger.info(`${email} attempting to authenticate`);
  co(function* () {
    const result = yield database.getIdAndHashFromEmail(email);
    try {
      yield auth.verifyStringAgainstHash(password, result.password)
    } catch (e) {
      return errors.sendError(errors.ERRORS.INVALID_AUTH_INFO, next);
    }
    const token = yield auth.generateUserJwt(result.id);
    logger.info(`${email} successfully authenticated`);
    res.send({token: token})
  }).catch(next)
});

router.post("/forgot", (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    errors.sendError(errors.ERRORS.EMAIL_REQUIRED, next);
    return;
  }
  co(function *() {
    yield database.invalidateResetIdsForEmail(email);
    const userId = (yield database.getIdAndHashFromEmail(email)).id;

    // We don't want to tell them if they entered an invalid email
    if (!util.isNullOrUndefined(userId)) {
      const id = (yield database.insertResetIdForEmail(email)).insertId;
      const token = auth.generateEmailJwt(email, id);
      yield mailer.sendPasswordReset(email, req.useragent, token);
    }
    res.send({
      message: "success"
    });
  }).catch(next);
});

router.post("/reset", (req, res, next) => {
  const token = req.body.token;
  const password = req.body.password;
  co(function *() {
    const jwt = yield auth.unHashJwtToken(token);
    const email = jwt.sub;
    const storedTokenId = (yield database.getHashIdFromEmail(email)).id;

    // Either this token is going to be used or invalid, so let's just invalidate it early
    yield database.invalidateResetIdForId(storedTokenId);
    if (storedTokenId !== jwt.tokenId || moment.utc().isAfter(moment.utc(jwt.exp))) {
      return errors.sendError(errors.ERRORS.RESET_TOKEN_INVALID, next);
    }

    const hashedPassword = yield auth.hashString(password);
    yield database.updatePasswordHash(email, hashedPassword);
    res.send({
      message: "success"
    });

  }).catch(next);
});



module.exports = router;
