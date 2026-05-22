const express = require("express");
const router = express.Router();
const { query } = require("express-validator");
const { exportCSV, exportPDF } = require("../controllers/exportController");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const validate = require("../middleware/validate");

const expenseCategories = [
    "Food & Dining",
    "Transportation",
    "Shopping",
    "Entertainment",
    "Health & Medical",
    "Bills & Utilities",
    "Education",
    "Travel",
    "Personal Care",
    "Other",
];

const paymentMethods = [
    "Cash",
    "Credit Card",
    "Debit Card",
    "UPI",
    "Net Banking",
    "Other",
];

const exportQueryValidation = [
    query("category")
        .optional({ values: "falsy" })
        .isIn(["All", ...expenseCategories]).withMessage("Invalid expense category"),
    query("paymentMethod")
        .optional({ values: "falsy" })
        .isIn(["All", ...paymentMethods]).withMessage("Invalid payment method"),
    query("startDate")
        .optional({ values: "falsy" })
        .isISO8601().withMessage("Start date must be a valid date"),
    query("endDate")
        .optional({ values: "falsy" })
        .isISO8601().withMessage("End date must be a valid date"),
];

// ── Special middleware for export routes ──
// Supports secure auth cookie plus legacy header/query token fallback.
const exportAuth = async (req, res, next) => {
    let token;

    if (req.cookies?.smartspend_token) {
        token = req.cookies.smartspend_token;
    }

    // Check header first
    if (
        !token &&
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        token = req.headers.authorization.split(" ")[1];
    }

    // Then check query param (for browser testing)
    if (!token && req.query.token) {
        token = req.query.token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Not authorized",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }
};

router.get("/csv", exportAuth, exportQueryValidation, validate, exportCSV);
router.get("/pdf", exportAuth, exportQueryValidation, validate, exportPDF);

module.exports = router;
