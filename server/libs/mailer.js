"use strict";

const nodemailer = require("nodemailer");
const ejs = require('ejs');
const logger = require("./logger.js").logger;
const util = require("util");

const baseUrl = process.env.CLIENT_BASE_URL;
const mailerUser = process.env.MAILER_USER;
const mailerPassword = process.env.MAILER_PASSWORD;

if (util.isNullOrUndefined(mailerUser) || util.isNullOrUndefined(mailerPassword)) {
  logger.warn("Both MAILER_USER and MAILER_PASSWORD must be defined env vars to send emails");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: mailerUser,
    pass: mailerPassword
  }
});

/**
 * Sends new invite password reset
 * @param email - email to send reset
 * @param resetToken - token for reset
 * @return {Promise} - if successfully sent or not
 */
function sendInviteReset(email, resetToken) {
  return new Promise((resolve, reject) => {
    const resetLink = `${baseUrl}/reset?token=${resetToken}`;
    const ejsOptions = {
      loginPage: `${process.env.CLIENT_BASE_URL}/login`,
      resetLink,
      email,
      mailerEmail: `${mailerUser}@gmail.com`
    };
    ejs.renderFile("./server/invite.ejs", ejsOptions, null, (err, html) => {
      if (err) {
        return reject(err);
      }
      const mailOptions = {
        to: email,
        from: "Lecture Viewer",
        subject: "Lecture Viewer Invite",
        html
      };
      transporter.sendMail(mailOptions, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  });
}

/**
 * Resets password
 * @param email - email to send reset
 * @param resetToken - token for reset
 * @param userAgent - user agent data
 * @return {Promise} - if successfully sent or not
 */
function sendPasswordReset(email, userAgent, resetToken) {
  return new Promise((resolve, reject) => {
    const resetLink = `${baseUrl}/reset?token=${resetToken}`;
    const ejsOptions = {
      resetLink,
      email,
      userAgent,
      mailerEmail: `${mailerUser}@gmail.com`
    };
    ejs.renderFile("./server/reset.ejs", ejsOptions, null, (err, html) => {
      if (err) {
        return reject(err);
      }
      const mailOptions = {
        to: email,
        from: "Lecture Viewer",
        subject: "Lecture Viewer Password Reset",
        html
      };
      transporter.sendMail(mailOptions, (error, response) => {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      });
    });
  });
}

module.exports = {
  sendPasswordReset,
  sendInviteReset
};
