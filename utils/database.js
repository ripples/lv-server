"use strict";

var mysql = require('mysql');
var config = require('../config.json').db;
var logger = require('./logger');

var pool = mysql.createPool({
  connectionLimit: 10,
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.name
});

/**
 *
 * @param username
 * @param callback
 */
function getHashedUserPassword(username, callback) {
  pool.getConnection((err, connection) => {
    if (err) {
      logger.error(err.message);
    } else {
      connection.query('SELECT password FROM users WHERE username=?',
        [username],
        (err, result) => {
          if (err) {
            logger.error(err.message);
          } else {
            logger.info(JSON.stringify(result));
          }
          connection.release();
        });
    }
  });
}

module.exports.getHashedUserPassword = getHashedUserPassword;
