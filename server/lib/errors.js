"use strict";

/**
 * Module to aggregate the standard error messages
 */

const ERRORS = {
  EMAIL_REQUIRED: "Email required",
  INVALID_AUTH_INFO: "Invalid email or password",
  RESET_TOKEN_INVALID: "Reset token is invalid",
  TOKEN_EXPIRED: "Token expired",
  UNAUTHORIZED_ACCESS: "Unauthorized access"

};

/**
 * Creates new Error
 * @param {String} message - error message
 * @param {Number} status - status code
 * @param {Function} next - next express callback
 */
function sendError(message, status, next) {
  let err = new Error(message);
  err.status = status;
  next(err);
}

module.exports = {
  ERRORS: ERRORS,
  sendError: sendError
};
