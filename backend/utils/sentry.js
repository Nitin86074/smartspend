const Sentry = require("@sentry/node");

const initSentry = (app) => {
    if (!process.env.SENTRY_DSN) return false;

    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || "development",
        tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.2),
        sendDefaultPii: false,
    });

    if (app && typeof Sentry.setupExpressErrorHandler === "function") {
        Sentry.setupExpressErrorHandler(app);
    }

    return true;
};

const captureException = (error, context = {}) => {
    if (!process.env.SENTRY_DSN) return;

    Sentry.captureException(error, context);
};

module.exports = {
    Sentry,
    captureException,
    initSentry,
};
