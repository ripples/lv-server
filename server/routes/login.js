"use strict";

const express = require("express");
const router = express.Router();
const co = require("co");

const database = require("../lib/database");
const logger = require("../lib/logger").logger;
const errors = require("../lib/errors");
const mailer = require("../lib/mailer");
const auth = require("../lib/auth");


// login
router.post("/", (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  logger.info(`${email} attempting to authenticate`);
  co(function* () {
    const result = yield database.getIdAndHashFromEmail(email);
    yield auth.verifyStringAgainstHash(password, result.password).catch(() => {
      errors.sendError(errors.ERRORS.INVALID_AUTH_INFO, next)
    });
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
    const id = (yield database.insertResetIdForEmail(email)).insertId;
    const token = auth.generateEmailJwt(email, id);
    yield mailer.sendPasswordReset(email, token);
    res.send({
      message: "success"
    });
  }).catch(next);
});

router.post("/reset", (req, res, next) => {
  const token = req.body.token;
  const password = req.body.password;
  co(function *() {
    const jwtToken = yield auth.unHashJwtToken(token);
    const email = jwtToken.email;
    const storedTokenId = (yield database.getHashIdFromEmail(email)).id;
    if (storedTokenId !== jwtToken.id) {
      errors.sendError(errors.ERRORS.RESET_TOKEN_INVALID, next);
    }

    const hashedPassword = yield auth.hashString(password);
    yield database.invalidateResetIdForId(storedTokenId);
    yield database.updatePasswordHash(email, hashedPassword);
    res.send({
      message: "success"
    });

  }).catch(next);
});



module.exports = router;
