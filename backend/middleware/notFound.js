const ErrorResponse = require("../utils/errorResponse");

const notFound = (req, res, next) => {
    next(new ErrorResponse(`Route ${req.method} ${req.originalUrl} not found`, 404));
};

module.exports = notFound;
