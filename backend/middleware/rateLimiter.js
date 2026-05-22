const rateLimit = require("express-rate-limit");

// ─── General API rate limiter ─────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 500 : 100,
    message: {
        success: false,
        message: "Too many requests from this IP. Please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { apiLimiter };