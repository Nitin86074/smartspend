const logger = require("../utils/logger");
const { captureException } = require("../utils/sentry");

const isDevelopment = process.env.NODE_ENV === "development";

const buildErrorDetails = (err) => {
    if (err.errors && Array.isArray(err.errors)) {
        return err.errors;
    }

    if (err.name === "ValidationError") {
        return Object.entries(err.errors || {}).map(([field, value]) => ({
            field,
            message: value.message,
        }));
    }

    return undefined;
};

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || res.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let code = err.code || "SERVER_ERROR";

    if (statusCode < 400) statusCode = 500;

    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid resource id";
        code = "INVALID_ID";
    }

    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || "field";
        message = `${field} already exists`;
        code = "DUPLICATE_RESOURCE";
    }

    if (err.name === "ValidationError") {
        statusCode = 400;
        const firstError = Object.values(err.errors || {})[0];
        message = firstError?.message || "Validation failed";
        code = "VALIDATION_ERROR";
    }

    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token. Please login again.";
        code = "INVALID_TOKEN";
    }

    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Your session has expired. Please login again.";
        code = "TOKEN_EXPIRED";
    }

    if (err.type === "entity.parse.failed") {
        statusCode = 400;
        message = "Invalid JSON body";
        code = "INVALID_JSON";
    }

    if (err.type === "entity.too.large") {
        statusCode = 413;
        message = "Request body is too large";
        code = "PAYLOAD_TOO_LARGE";
    }

    const details = buildErrorDetails(err);

    if (statusCode >= 500) {
        captureException(err, {
            tags: {
                method: req.method,
                path: req.originalUrl,
            },
            extra: {
                code,
                statusCode,
            },
        });
    }

    logger.error(message, {
        code,
        statusCode,
        method: req.method,
        path: req.originalUrl,
        stack: err.stack,
    });

    res.status(statusCode).json({
        success: false,
        message,
        error: {
            code,
            ...(details && { details }),
        },
        ...(isDevelopment && { stack: err.stack }),
    });
};

module.exports = errorHandler;
