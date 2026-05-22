// ─────────────────────────────────────────────────────────────────────
// Custom Error Class
// Extends built-in Error to add statusCode
// ─────────────────────────────────────────────────────────────────────
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;

        // Capture stack trace
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = ErrorResponse;