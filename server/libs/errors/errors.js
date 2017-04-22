class ResponseError extends Error {
  constructor(error, status, data=null) {
    super(error);
    this.status = status;
    this.data = data;
  };
}

class EmailRequired extends ResponseError {
  constructor() {super("Email required", 400); };
}

class InvalidAuthInfo extends ResponseError {
  constructor() {super("Invalid email or password", 400); };
}

class ResetTokenInvalid extends ResponseError {
  constructor() {super("Reset token is invalid", 401); };
}

class ResetTokenExpired extends ResponseError {
  constructor() {super("Reset token has expired", 401); };
}

class JwtTokenExpired extends ResponseError {
  constructor() {super("JWT Token expired", 401); };
}

class UnauthorizedAccess extends ResponseError {
  constructor() {super("Unauthorized access", 401); };
}

class NotFound extends ResponseError {
  constructor(item) {super(`${item} not found`, 404); };
}

module.exports = {
  EmailRequired,
  InvalidAuthInfo,
  ResetTokenInvalid,
  ResetTokenExpired,
  JwtTokenExpired,
  UnauthorizedAccess,
  NotFound
};
