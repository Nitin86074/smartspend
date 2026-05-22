const { validationResult } = require("express-validator");

// ─────────────────────────────────────────────────────────────────────
// Middleware: Check express-validator results
// Use this after validation rules in any route
// ─────────────────────────────────────────────────────────────────────
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Get all error messages as an array
        const errorMessages = errors.array().map((err) => ({
            field: err.path,
            message: err.msg,
        }));

        return res.status(400).json({
            success: false,
            message: errorMessages[0].message, // first error as main message
            errors: errorMessages,             // all errors for frontend
        });
    }

    next();
};

module.exports = validate;