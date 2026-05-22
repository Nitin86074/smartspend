const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const { apiLimiter } = require("./middleware/rateLimiter");
const logger = require("./utils/logger");
const { initSentry } = require("./utils/sentry");

// ─── Load Environment Variables ───────────────────────────────────────
dotenv.config();

// ─── Connect to Database ──────────────────────────────────────────────
connectDB();

const app = express();
initSentry(app);

// ─────────────────────────────────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────

// Set security HTTP headers
app.use(helmet());


// ─────────────────────────────────────────────────────────────────────
// CORS CONFIGURATION
// ─────────────────────────────────────────────────────────────────────
app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:3000"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// ─────────────────────────────────────────────────────────────────────
// BODY PARSER
// ─────────────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─────────────────────────────────────────────────────────────────────
// REQUEST LOGGING
// ─────────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// ─────────────────────────────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────────────────────────────
app.use("/api/", apiLimiter);

// ─────────────────────────────────────────────────────────────────────
// HEALTH CHECK ROUTE
// ─────────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SmartSpend API is running",
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        version: "2.0.0",
        endpoints: {
            auth: "/api/auth",
            expenses: "/api/expenses",
            income: "/api/income",
            budget: "/api/budget",
            insights: "/api/insights",
            accounts: "/api/accounts",
            export: "/api/export",
            docs: "/api/docs",
        },
    });
});

// ─────────────────────────────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/auth"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/income", require("./routes/income"));
app.use("/api/budget", require("./routes/budget"));
app.use("/api/insights", require("./routes/insights"));
app.use("/api/accounts", require("./routes/accounts"));
app.use("/api/export", require("./routes/export"));
app.use("/api", require("./routes/docs"));

// ─────────────────────────────────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────────────────────────────────
app.use(notFound);

// ─────────────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Must be last middleware
// ─────────────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    logger.info(
        `🚀 SmartSpend server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
    console.log(
        `🚀 SmartSpend server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
});

// ─────────────────────────────────────────────────────────────────────
// HANDLE UNHANDLED REJECTIONS
// ─────────────────────────────────────────────────────────────────────
process.on("unhandledRejection", (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    console.error(`❌ Uncaught Exception: ${err.message}`);
    process.exit(1);
});

module.exports = app;
