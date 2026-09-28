export function errorHandler(error, _request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  const message =
    statusCode >= 500 ? "Internal server error" : error.message;

  if (statusCode >= 500) {
    console.error("Request failed (" + (error.code || "INTERNAL_ERROR") + ").");
  }

  response.status(statusCode).json({
    success: false,
    message,
  });
}