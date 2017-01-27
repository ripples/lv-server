"use strict";

/**
 * Module to aggregate the standard error messages
 */

const ERRORS = {
  EMAIL_REQUIRED: ["Email required", 400],
  INVALID_AUTH_INFO: ["Invalid email or password", 400],
  RESET_TOKEN_INVALID: ["Reset token is invalid", 401],
  TOKEN_EXPIRED: ["Token expired", 401],
  UNAUTHORIZED_ACCESS: ["Unauthorized access", 401]

};

/**
 * Creates new Error
 * @param {Array} error - error message
 * @param {Function} next - next express callback
 */
function sendError(error, next) {
  let err = new Error(error[0]);
  err.status = error[1];
  next(err);
}

module.exports = {
  ERRORS: ERRORS,
  sendError: sendError
};
