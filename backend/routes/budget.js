const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const { setBudget, getBudget } = require("../controllers/budgetController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const budgetCategories = [
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

const budgetValidation = [
    body("monthlyLimit")
        .notEmpty().withMessage("Monthly limit is required")
        .isFloat({ min: 1 }).withMessage("Monthly limit must be at least 1"),
    body("categoryBudgets")
        .optional()
        .isArray().withMessage("Category budgets must be an array"),
    body("categoryBudgets.*.category")
        .optional()
        .isIn(budgetCategories).withMessage("Invalid budget category"),
    body("categoryBudgets.*.limit")
        .optional()
        .isFloat({ min: 1 }).withMessage("Category budget limit must be at least 1"),
];

router.use(protect);

router.post("/", budgetValidation, validate, setBudget);
router.get("/", getBudget);

module.exports = router;
