"use strict";

const router = require("express").Router();
const mailer = require("../../libs/mailer");
const database = require("../../libs/database");
const auth = require("../../libs/auth");
const co = require("co");
const _ = require("lodash");
const moment = require("moment");
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
        yield database.invalidateResetIdsForEmail(email);

        // Token lasts until 1 week before semester ends
        const id = (yield database.insertResetIdForEmail(email)).insertId;
        const semesterEndEpoch = (yield database.getCurrentSemesterInfo()).data.endEpoch;
        const timeUntilSemesterEnd = moment.duration(moment(semesterEndEpoch) - moment());
        const emailDuration = timeUntilSemesterEnd.subtract(1, "week");

        const token = auth.generateEmailJwt(email, id, emailDuration.asMilliseconds(), "milliseconds");
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
