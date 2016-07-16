"use srict";

/**
 * Module to agregate the standart error messages
 */

const keyMirror = require("keymirror");

const ERRORS = keyMirror({
  LOGIN_EMAIL_PASS_FAILED: null,
  TOKEN_EXPIRED: null,
  UNAUTHORIZED_ACCESS: null,
  TOKEN_NOT_RECEIVED: null,
  UNEXPECTED_ERROR: null
});

module.exports = ERRORS;
