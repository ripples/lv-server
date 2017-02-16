"use strict";

const router = require("express").Router();
const mailer = require("../../libs/mailer");
const database = require("../../libs/database");
const auth = require("../../libs/auth");
const co = require("co");
const _ = require("lodash");
const logger = require("../../libs/logger.js").logger;

/**
 * Serves meta data for course
 */

router.post("/invite", (req, res, next) => {
  const emails = req.body.emails;
  if (process.env.NODE_ENV !== "production") {
    return res.send({message: "Emails only sent in production mode"})
  }

  const promises = emails.map((email) => {
    return new Promise((resolve, reject) => {
      co(function* () {
        const id = (yield database.insertResetIdForEmail(email)).insertId;
        const token = auth.generateEmailJwt(email, id);
        const response = yield mailer.sendInviteReset(email, token);
        resolve(response);
      });
    });
  });
  Promise.all(promises).then(responses => {
     res.send(_.countBy(responses, (response) => {
      if(response.rejected.length > 0) {
        logger.info(`Failed to invite ${response.rejected[0]}`);
        return 'error';
      }
       logger.info(`Invited ${response.accepted[0]}`);
       return 'success';
    }));
  }).catch(next);
});

module.exports = router;
