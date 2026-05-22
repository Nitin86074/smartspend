const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const ErrorResponse = require("../utils/errorResponse");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/budget
// @desc    Create or update user's budget
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.setBudget = async (req, res, next) => {
    try {
        const { monthlyLimit, categoryBudgets } = req.body;

        // Basic validation
        if (!monthlyLimit || monthlyLimit <= 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid monthly limit",
            });
        }

        const now = new Date();
        const month = now.getMonth() + 1; // JS months are 0-indexed
        const year = now.getFullYear();

        // If budget already exists for this user, update it
        // If not, create a new one
        // "upsert: true" means: update if exists, insert if not
        const budget = await Budget.findOneAndUpdate(
            { user: req.user.id },
            {
                user: req.user.id,
                monthlyLimit,
                categoryBudgets: categoryBudgets || [],
                month,
                year,
            },
            {
                new: true,        // return the updated document
                upsert: true,     // create if doesn't exist
                runValidators: true,
            }
        );

        res.status(200).json({
            success: true,
            message: "Budget saved successfully",
            data: budget,
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/budget
// @desc    Get user's budget + compare with actual spending
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.getBudget = async (req, res, next) => {
    try {
        // Step 1: Find the user's budget
        const budget = await Budget.findOne({ user: req.user.id });

        if (!budget) {
            return res.status(404).json({
                success: false,
                message: "No budget found. Please set a budget first.",
            });
        }

        // Step 2: Calculate how much user spent THIS month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Total spent this month
        const totalSpentResult = await Expense.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id),
                    date: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$amount" },
                },
            },
        ]);

        const totalSpent = totalSpentResult[0]?.total || 0;

        // Step 3: Category-wise spending this month
        const categorySpending = await Expense.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(req.user.id),
                    date: { $gte: startOfMonth, $lte: endOfMonth },
                },
            },
            {
                $group: {
                    _id: "$category",
                    spent: { $sum: "$amount" },
                },
            },
        ]);

        // Step 4: Compare each category budget with actual spending
        const categoryComparison = budget.categoryBudgets.map((cb) => {
            const spendingEntry = categorySpending.find(
                (s) => s._id === cb.category
            );
            const spent = spendingEntry?.spent || 0;
            const remaining = cb.limit - spent;
            const percentage = Math.round((spent / cb.limit) * 100);

            return {
                category: cb.category,
                limit: cb.limit,
                spent,
                remaining: remaining < 0 ? 0 : remaining,
                percentage: percentage > 100 ? 100 : percentage,
                isExceeded: spent > cb.limit,
                // Warning levels
                status:
                    percentage >= 100
                        ? "exceeded"
                        : percentage >= 80
                            ? "warning"
                            : "safe",
            };
        });

        // Step 5: Overall budget status
        const remainingTotal = budget.monthlyLimit - totalSpent;
        const overallPercentage = Math.round(
            (totalSpent / budget.monthlyLimit) * 100
        );

        res.status(200).json({
            success: true,
            message: "Budget fetched successfully",
            data: {
                budget: {
                    monthlyLimit: budget.monthlyLimit,
                    month: budget.month,
                    year: budget.year,
                },
                summary: {
                    totalSpent,
                    remaining: remainingTotal < 0 ? 0 : remainingTotal,
                    overSpent: totalSpent > budget.monthlyLimit ? totalSpent - budget.monthlyLimit : 0,
                    percentage: overallPercentage > 100 ? 100 : overallPercentage,
                    isExceeded: totalSpent > budget.monthlyLimit,
                    status:
                        overallPercentage >= 100
                            ? "exceeded"
                            : overallPercentage >= 80
                                ? "warning"
                                : "safe",
                },
                categoryComparison,
            },
        });
    } catch (error) {
        next(error);
    }
};