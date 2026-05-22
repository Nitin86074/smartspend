const Income = require("../models/Income");
const Expense = require("../models/Expense");
const ErrorResponse = require("../utils/errorResponse");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/income
// @desc    Add new income
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.addIncome = async (req, res, next) => {
    try {
        const { title, amount, category, date, notes, isRecurring } = req.body;

        // Validation
        if (!title || !amount || !date) {
            return res.status(400).json({
                success: false,
                message: "Title, amount and date are required",
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than 0",
            });
        }

        const income = await Income.create({
            user: req.user.id,
            title,
            amount,
            category: category || "Salary",
            date,
            notes,
            isRecurring: isRecurring || false,
        });

        res.status(201).json({
            success: true,
            message: "Income added successfully",
            data: income,
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/income
// @desc    Get all income + balance calculation
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.getIncome = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            startDate,
            endDate,
            category,
        } = req.query;

        // Build filter
        const filter = { user: req.user.id };

        if (category && category !== "All") {
            filter.category = category;
        }

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }

        // Pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Get income list + total count in parallel
        const [incomes, total] = await Promise.all([
            Income.find(filter)
                .sort({ date: -1 })
                .skip(skip)
                .limit(limitNum),
            Income.countDocuments(filter),
        ]);

        // ── Calculate this month's income ──
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const [monthlyIncomeResult, monthlyExpenseResult, totalIncomeResult] =
            await Promise.all([

                // This month's total income
                Income.aggregate([
                    {
                        $match: {
                            user: new mongoose.Types.ObjectId(req.user.id),
                            date: { $gte: startOfMonth, $lte: endOfMonth },
                        },
                    },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ]),

                // This month's total expense
                Expense.aggregate([
                    {
                        $match: {
                            user: new mongoose.Types.ObjectId(req.user.id),
                            date: { $gte: startOfMonth, $lte: endOfMonth },
                        },
                    },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ]),

                // All time total income
                Income.aggregate([
                    {
                        $match: {
                            user: new mongoose.Types.ObjectId(req.user.id),
                        },
                    },
                    { $group: { _id: null, total: { $sum: "$amount" } } },
                ]),
            ]);

        const monthlyIncome = monthlyIncomeResult[0]?.total || 0;
        const monthlyExpense = monthlyExpenseResult[0]?.total || 0;
        const totalIncome = totalIncomeResult[0]?.total || 0;
        const monthlyBalance = monthlyIncome - monthlyExpense;

        res.status(200).json({
            success: true,
            message: "Income fetched successfully",
            data: {
                incomes,
                pagination: {
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    currentPage: pageNum,
                    limit: limitNum,
                },
                summary: {
                    totalIncome,
                    thisMonth: {
                        income: monthlyIncome,
                        expenses: monthlyExpense,
                        balance: monthlyBalance,
                        status: monthlyBalance >= 0 ? "surplus" : "deficit",
                    },
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   DELETE /api/income/:id
// @desc    Delete an income entry
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.deleteIncome = async (req, res, next) => {
    try {
        const income = await Income.findById(req.params.id);

        if (!income) {
            return next(new ErrorResponse("Income not found", 404));
        }

        // Make sure user owns this income
        if (income.user.toString() !== req.user.id) {
            return next(new ErrorResponse("Not authorized", 401));
        }

        await income.deleteOne();

        res.status(200).json({
            success: true,
            message: "Income deleted successfully",
            data: {},
        });
    } catch (error) {
        next(error);
    }
};