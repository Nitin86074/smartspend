const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const {
    addIncome,
    getIncome,
    deleteIncome,
} = require("../controllers/incomeController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const incomeCategories = [
    "Salary",
    "Freelance",
    "Business",
    "Investment",
    "Rental",
    "Gift",
    "Other",
];

const incomeValidation = [
    body("title")
        .trim()
        .notEmpty().withMessage("Title is required")
        .isLength({ max: 100 }).withMessage("Title cannot exceed 100 characters"),
    body("amount")
        .notEmpty().withMessage("Amount is required")
        .isFloat({ min: 1 }).withMessage("Amount must be at least 1"),
    body("category")
        .optional({ values: "falsy" })
        .isIn(incomeCategories).withMessage("Invalid income category"),
    body("date")
        .notEmpty().withMessage("Date is required")
        .isISO8601().withMessage("Date must be a valid date"),
    body("notes")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
    body("isRecurring")
        .optional()
        .isBoolean().withMessage("isRecurring must be true or false"),
];

const incomeQueryValidation = [
    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive number"),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("category")
        .optional({ values: "falsy" })
        .isIn(["All", ...incomeCategories]).withMessage("Invalid income category"),
    query("startDate")
        .optional({ values: "falsy" })
        .isISO8601().withMessage("Start date must be a valid date"),
    query("endDate")
        .optional({ values: "falsy" })
        .isISO8601().withMessage("End date must be a valid date"),
];

const mongoIdParamValidation = [
    param("id").isMongoId().withMessage("Invalid income id"),
];

router.use(protect);

router.route("/")
    .post(incomeValidation, validate, addIncome)
    .get(incomeQueryValidation, validate, getIncome);

router.route("/:id")
    .delete(mongoIdParamValidation, validate, deleteIncome);

module.exports = router;
