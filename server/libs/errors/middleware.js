function errorHandler(err, req, res, next) {
  const status = err.status ? err.status : 500;
  let response = null;
  if (status >= 500) {
    response = {error: "Something went wrong"};
  } else {
    response = {error: err.message};
    if (err.data) {
      response.errors = err.data;
    }
  }
  res.status(status).json(response);
}


module.exports = errorHandler;
