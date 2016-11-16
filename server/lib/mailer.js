"use strict";

const nodemailer = require("nodemailer");

const baseUrl = process.env.CLIENT_BASE_URL;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASSWORD
  }
});

/**
 * Resets password
 * @param email - email to send reset
 * @param resetToken - token for reset
 * @return {Promise} - if successfully sent or not
 */
function sendPasswordReset(email, resetToken) {
  const resetText = `
Somebody (hopefully you) requested a new password for the Lecture Viewer account for ${email}.

You can reset your password by clicking the link below:

${baseUrl}/reset?token=${resetToken}

If you did not request a new password, please let us know immediately by replying to this email.

Yours,

The Lecture Viewer team
`;
  return new Promise((resolve, reject) => {
    const mailOptions = {
      to: email,
      from: "Lecture Viewer",
      subject: "Password Reset",
      text: resetText
    };
    transporter.sendMail(mailOptions, (error, response) => {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    });
  });
}

module.exports = {
  sendPasswordReset: sendPasswordReset
};
