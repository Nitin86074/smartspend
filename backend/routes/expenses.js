const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const {
    addExpense,
    getExpenses,
    getExpense,
    updateExpense,
    deleteExpense,
    getStats,
    addRecurringExpense,
    getRecurringExpenses,
    toggleRecurringExpense,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/auth");
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

const expenseValidation = [
    body("title")
        .trim()
        .notEmpty().withMessage("Title is required")
        .isLength({ max: 100 }).withMessage("Title cannot exceed 100 characters"),
    body("amount")
        .notEmpty().withMessage("Amount is required")
        .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("category")
        .optional({ values: "falsy" })
        .isIn(expenseCategories).withMessage("Invalid expense category"),
    body("paymentMethod")
        .optional({ values: "falsy" })
        .isIn(paymentMethods).withMessage("Invalid payment method"),
    body("date")
        .notEmpty().withMessage("Date is required")
        .isISO8601().withMessage("Date must be a valid date"),
    body("notes")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
];

const updateExpenseValidation = [
    body("title")
        .optional()
        .trim()
        .notEmpty().withMessage("Title cannot be empty")
        .isLength({ max: 100 }).withMessage("Title cannot exceed 100 characters"),
    body("amount")
        .optional()
        .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("category")
        .optional()
        .isIn(expenseCategories).withMessage("Invalid expense category"),
    body("paymentMethod")
        .optional()
        .isIn(paymentMethods).withMessage("Invalid payment method"),
    body("date")
        .optional()
        .isISO8601().withMessage("Date must be a valid date"),
    body("notes")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
];

const recurringExpenseValidation = [
    body("title")
        .trim()
        .notEmpty().withMessage("Title is required")
        .isLength({ max: 100 }).withMessage("Title cannot exceed 100 characters"),
    body("amount")
        .notEmpty().withMessage("Amount is required")
        .isFloat({ min: 0.01 }).withMessage("Amount must be greater than 0"),
    body("category")
        .optional({ values: "falsy" })
        .isIn(expenseCategories).withMessage("Invalid expense category"),
    body("paymentMethod")
        .optional({ values: "falsy" })
        .isIn(paymentMethods).withMessage("Invalid payment method"),
    body("recurringFrequency")
        .notEmpty().withMessage("Recurring frequency is required")
        .isIn(["daily", "weekly", "monthly"]).withMessage("Recurring frequency must be daily, weekly, or monthly"),
    body("notes")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
];

const expenseQueryValidation = [
    query("page")
        .optional()
        .isInt({ min: 1 }).withMessage("Page must be a positive number"),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
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
    query("minAmount")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 }).withMessage("Minimum amount must be 0 or more"),
    query("maxAmount")
        .optional({ values: "falsy" })
        .isFloat({ min: 0 }).withMessage("Maximum amount must be 0 or more"),
    query("sortBy")
        .optional()
        .isIn(["date", "amount", "title", "category"]).withMessage("Invalid sort field"),
    query("order")
        .optional()
        .isIn(["asc", "desc"]).withMessage("Order must be asc or desc"),
];

const mongoIdParamValidation = [
    param("id").isMongoId().withMessage("Invalid expense id"),
];

router.use(protect);

router.get("/stats/summary", getStats);
router.route("/")
    .get(expenseQueryValidation, validate, getExpenses)
    .post(expenseValidation, validate, addExpense);

router.post("/recurring", recurringExpenseValidation, validate, addRecurringExpense);
router.get("/recurring", getRecurringExpenses);
router.put("/recurring/:id/toggle", mongoIdParamValidation, validate, toggleRecurringExpense);

router.route("/:id")
    .get(mongoIdParamValidation, validate, getExpense)
    .put(mongoIdParamValidation, updateExpenseValidation, validate, updateExpense)
    .delete(mongoIdParamValidation, validate, deleteExpense);

module.exports = router;
