"use strict";

const express = require("express");
const router = express.Router();
const co = require("co");
const moment = require("moment");

const database = require("../libs/database");
const logger = require("../libs/logger").logger;
const mailer = require("../libs/mailer");
const errors = require("../libs/errors/errors");
const auth = require("../libs/auth");


// login
router.post("/", (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!email || !password) {
    throw new errors.EmailRequired();
  }

  logger.info(`${email} attempting to authenticate`);
  co(function* () {
    const result = (yield database.getIdAndHashFromEmail(email)).data;
    try {
      yield auth.verifyStringAgainstHash(password, result.password)
    } catch (e) {
      throw new errors.InvalidAuthInfo();
    }
    const token = yield auth.generateUserJwt(result.id);
    logger.info(`${email} successfully authenticated`);
    res.send({token: token})
  }).catch(next)
});

router.post("/forgot", (req, res, next) => {
  const email = req.body.email;
  if (!email) {
    throw new errors.EmailRequired();
  }

  logger.info(`${email} forgot password`);

  co(function *() {
    yield database.invalidateResetIdsForEmail(email);
    const user = (yield database.getIdAndHashFromEmail(email)).data;
    // We don't want to tell them if they entered an invalid email
    // TODO: wait half a second or so because it's easy to tell when the email is valid or not based on how quickly server responds
    if (user) {
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

    const result = (yield database.getHashIdFromEmail(email)).data;
    let storedTokenId = "";
    if (result !== undefined) {
      storedTokenId = result.id;
      // Either this token is going to be used or invalid, so let's just invalidate it early
      yield database.invalidateResetIdForId(storedTokenId);
    }

    if (storedTokenId !== jwt.tokenId) {
      throw new errors.ResetTokenInvalid();
    } else if (moment.utc().isAfter(moment.utc(jwt.exp))) {
      throw new errors.ResetTokenExpired();
    }

    const hashedPassword = yield auth.hashString(password);
    yield database.updatePasswordHash(email, hashedPassword);
    res.send({
      message: "success"
    });
  }).catch(next);
});



module.exports = router;
