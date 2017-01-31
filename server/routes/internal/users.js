"use strict";

const router = require("express").Router();
const mailer = require("../../libs/mailer");
const database = require("../../libs/database");
const auth = require("../../libs/auth");
const co = require("co");
const logger = require("../../libs/logger.js").logger;

/**
 * Serves meta data for course
 */

router.post("/invite", (req, res, next) => {
  const emails = req.body.emails;
  if (process.env.NODE_ENV === "development") {
    co(function* () {
      yield emails.map(function* (email) {
        const id = (yield database.insertResetIdForEmail(email)).insertId;
        const token = auth.generateEmailJwt(email, id);
        yield mailer.sendInviteReset(email, token);
        logger.info(`Invited ${email}`);
        res.send({message: "Emails are being sent"});
      })
    }).catch(next);
  }
});

module.exports = router;
