"use strict";

var mysql = require('mysql');
var logger = require('./logger');

var pool = mysql.createPool({
  connectionLimit: 10,
  host: 'db',
  user: 'root',
  password: process.env.MYSQL_ROOT_PASSWORD,
  database: process.env.MYSQL_DATABASE
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
