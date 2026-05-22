const Expense = require("../models/Expense");
const ErrorResponse = require("../utils/errorResponse");
const { smartCategorize } = require("../utils/categorize");
const { validationResult } = require("express-validator");

// ─── @route   POST /api/expenses ─────────────────────────────────────
// ─── @access  Private
exports.addExpense = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
            });
        }

        const { title, amount, category, paymentMethod, date, notes } = req.body;

        // AI auto-categorization if category not provided
        const finalCategory = category || smartCategorize(title, notes);

        const expense = await Expense.create({
            user: req.user.id,
            title,
            amount,
            category: finalCategory,
            paymentMethod,
            date: date || Date.now(),
            notes,
        });

        res.status(201).json({
            success: true,
            message: "Expense added successfully",
            expense,
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/expenses
// @desc    Get all expenses with filtering, sorting and pagination
// @access  Private
//
// Query params supported:
//   search        → filter by title keyword
//   category      → filter by category name
//   paymentMethod → filter by payment method
//   startDate     → filter from this date (YYYY-MM-DD)
//   endDate       → filter until this date (YYYY-MM-DD)
//   minAmount     → filter expenses above this amount
//   maxAmount     → filter expenses below this amount
//   sortBy        → field to sort by (date | amount | title)
//   order         → asc | desc (default: desc)
//   page          → page number (default: 1)
//   limit         → results per page (default: 10)
// ─────────────────────────────────────────────────────────────────────
exports.getExpenses = async (req, res, next) => {
    try {
        const {
            search,
            category,
            paymentMethod,
            startDate,
            endDate,
            minAmount,
            maxAmount,
            sortBy = "date",
            order = "desc",
            page = 1,
            limit = 10,
        } = req.query;

        // ── Step 1: Build the filter object ──────────────────────────────
        const filter = { user: req.user.id };

        // Search by title (case-insensitive)
        if (search && search.trim() !== "") {
            filter.title = {
                $regex: search.trim(),
                $options: "i", // i = case insensitive
            };
        }

        // Filter by category
        if (category && category !== "All") {
            filter.category = category;
        }

        // Filter by payment method
        if (paymentMethod && paymentMethod !== "All") {
            filter.paymentMethod = paymentMethod;
        }

        // Filter by date range
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) {
                filter.date.$gte = new Date(startDate);
            }
            if (endDate) {
                // Set to end of day so the endDate is included
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.date.$lte = end;
            }
        }

        // Filter by amount range
        if (minAmount || maxAmount) {
            filter.amount = {};
            if (minAmount) filter.amount.$gte = parseFloat(minAmount);
            if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
        }

        // ── Step 2: Build sort options ────────────────────────────────────
        // Only allow valid sort fields to prevent injection
        const allowedSortFields = ["date", "amount", "title", "category"];
        const sortField = allowedSortFields.includes(sortBy) ? sortBy : "date";
        const sortOrder = order === "asc" ? 1 : -1;
        const sortOptions = { [sortField]: sortOrder };

        // ── Step 3: Pagination calculation ────────────────────────────────
        const pageNum = Math.max(1, parseInt(page));   // minimum page = 1
        const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // between 1-50
        const skip = (pageNum - 1) * limitNum;

        // ── Step 4: Run DB queries in parallel for speed ──────────────────
        const [expenses, total, allTimeTotal, filteredTotal] = await Promise.all([

            // Paginated expense list
            Expense.find(filter)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNum)
                .lean(), // .lean() returns plain JS objects = faster

            // Total count for pagination
            Expense.countDocuments(filter),

            // All time total amount (no filter applied)
            Expense.aggregate([
                { $match: { user: new (require("mongoose").Types.ObjectId)(req.user.id) } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),

            // Total amount of filtered results (for summary)
            Expense.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
        ]);

        // ── Step 5: Build response ────────────────────────────────────────
        const totalPages = Math.ceil(total / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        res.status(200).json({
            success: true,
            message: "Expenses fetched successfully",
            data: {
                expenses,
                pagination: {
                    total,           // total matching documents
                    totalPages,
                    currentPage: pageNum,
                    limit: limitNum,
                    hasNextPage,
                    hasPrevPage,
                },
                summary: {
                    filteredTotal: filteredTotal[0]?.total || 0,
                    allTimeTotal: allTimeTotal[0]?.total || 0,
                    showing: expenses.length,
                },
                // Echo back active filters so frontend knows what's applied
                activeFilters: {
                    search: search || null,
                    category: category || null,
                    paymentMethod: paymentMethod || null,
                    startDate: startDate || null,
                    endDate: endDate || null,
                    minAmount: minAmount || null,
                    maxAmount: maxAmount || null,
                    sortBy: sortField,
                    order,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── @route   GET /api/expenses/:id ─────────────────────────────────
// ─── @access  Private
exports.getExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return next(new ErrorResponse("Expense not found", 404));
        }

        // Make sure user owns this expense
        if (expense.user.toString() !== req.user.id) {
            return next(new ErrorResponse("Not authorized", 401));
        }

        res.status(200).json({ success: true, expense });
    } catch (error) {
        next(error);
    }
};

// ─── @route   PUT /api/expenses/:id ─────────────────────────────────
// ─── @access  Private
exports.updateExpense = async (req, res, next) => {
    try {
        let expense = await Expense.findById(req.params.id);

        if (!expense) {
            return next(new ErrorResponse("Expense not found", 404));
        }

        if (expense.user.toString() !== req.user.id) {
            return next(new ErrorResponse("Not authorized", 401));
        }

        expense = await Expense.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Expense updated successfully",
            expense,
        });
    } catch (error) {
        next(error);
    }
};

// ─── @route   DELETE /api/expenses/:id ──────────────────────────────
// ─── @access  Private
exports.deleteExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return next(new ErrorResponse("Expense not found", 404));
        }

        if (expense.user.toString() !== req.user.id) {
            return next(new ErrorResponse("Not authorized", 401));
        }

        await expense.deleteOne();

        res.status(200).json({
            success: true,
            message: "Expense deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

// ─── @route   GET /api/expenses/stats/summary ───────────────────────
// ─── @access  Private
exports.getStats = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // ── Total & this month stats ──
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalStats, monthlyStats, categoryStats, monthlyTrend] =
            await Promise.all([

                // All time total
                Expense.aggregate([
                    { $match: { user: require("mongoose").Types.ObjectId.createFromHexString(userId) } },
                    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
                ]),

                // This month total
                Expense.aggregate([
                    {
                        $match: {
                            user: require("mongoose").Types.ObjectId.createFromHexString(userId),
                            date: { $gte: startOfMonth },
                        },
                    },
                    { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
                ]),

                // Category breakdown
                Expense.aggregate([
                    { $match: { user: require("mongoose").Types.ObjectId.createFromHexString(userId) } },
                    {
                        $group: {
                            _id: "$category",
                            total: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { total: -1 } },
                ]),

                // Last 6 months trend
                Expense.aggregate([
                    {
                        $match: {
                            user: require("mongoose").Types.ObjectId.createFromHexString(userId),
                            date: {
                                $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
                            },
                        },
                    },
                    {
                        $group: {
                            _id: {
                                year: { $year: "$date" },
                                month: { $month: "$date" },
                            },
                            total: { $sum: "$amount" },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { "_id.year": 1, "_id.month": 1 } },
                ]),
            ]);

        // ── Format monthly trend ──
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedTrend = monthlyTrend.map((item) => ({
            month: `${months[item._id.month - 1]} ${item._id.year}`,
            total: item.total,
            count: item.count,
        }));

        res.status(200).json({
            success: true,
            stats: {
                allTime: {
                    total: totalStats[0]?.total || 0,
                    count: totalStats[0]?.count || 0,
                },
                thisMonth: {
                    total: monthlyStats[0]?.total || 0,
                    count: monthlyStats[0]?.count || 0,
                },
                categoryBreakdown: categoryStats.map((c) => ({
                    category: c._id,
                    total: c.total,
                    count: c.count,
                })),
                monthlyTrend: formattedTrend,
            },
        });
    } catch (error) {
        next(error);
    }
};
// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/expenses/recurring
// @desc    Add a recurring expense
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.addRecurringExpense = async (req, res, next) => {
    try {
        const {
            title,
            amount,
            category,
            paymentMethod,
            notes,
            recurringFrequency,
        } = req.body;

        // Validation
        if (!title || !amount || !recurringFrequency) {
            return res.status(400).json({
                success: false,
                message: "Title, amount and recurringFrequency are required",
            });
        }

        if (!["daily", "weekly", "monthly"].includes(recurringFrequency)) {
            return res.status(400).json({
                success: false,
                message: "recurringFrequency must be daily, weekly or monthly",
            });
        }

        // ── Calculate next due date based on frequency ──
        const today = new Date();
        let nextDueDate = new Date(today);

        if (recurringFrequency === "daily") {
            nextDueDate.setDate(today.getDate() + 1);
        } else if (recurringFrequency === "weekly") {
            nextDueDate.setDate(today.getDate() + 7);
        } else if (recurringFrequency === "monthly") {
            nextDueDate.setMonth(today.getMonth() + 1);
        }

        const { smartCategorize } = require("../utils/categorize");
        const finalCategory = category || smartCategorize(title, notes);

        const expense = await Expense.create({
            user: req.user.id,
            title,
            amount,
            category: finalCategory,
            paymentMethod: paymentMethod || "Cash",
            date: today,
            notes,
            isRecurring: true,
            recurringFrequency,
            nextDueDate,
            isActive: true,
        });

        res.status(201).json({
            success: true,
            message: `Recurring ${recurringFrequency} expense added successfully`,
            data: expense,
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/expenses/recurring
// @desc    Get all recurring expenses for user
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.getRecurringExpenses = async (req, res, next) => {
    try {
        const recurringExpenses = await Expense.find({
            user: req.user.id,
            isRecurring: true,
        }).sort({ nextDueDate: 1 }); // soonest due first

        // ── Tag which ones are due today or overdue ──
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tagged = recurringExpenses.map((exp) => {
            const due = new Date(exp.nextDueDate);
            due.setHours(0, 0, 0, 0);

            const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

            let dueSatus = "upcoming";
            if (diffDays < 0) dueSatus = "overdue";
            else if (diffDays === 0) dueSatus = "due_today";
            else if (diffDays <= 3) dueSatus = "due_soon";

            return {
                ...exp.toObject(),
                dueStatus: dueSatus,
                daysUntilDue: diffDays,
            };
        });

        // ── Monthly cost summary ──
        const monthlyCost = recurringExpenses.reduce((total, exp) => {
            if (!exp.isActive) return total;
            if (exp.recurringFrequency === "monthly") return total + exp.amount;
            if (exp.recurringFrequency === "weekly") return total + exp.amount * 4;
            if (exp.recurringFrequency === "daily") return total + exp.amount * 30;
            return total;
        }, 0);

        res.status(200).json({
            success: true,
            message: "Recurring expenses fetched successfully",
            data: {
                recurringExpenses: tagged,
                summary: {
                    totalRecurring: recurringExpenses.length,
                    estimatedMonthlyCost: monthlyCost,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   PUT /api/expenses/recurring/:id/toggle
// @desc    Activate or deactivate a recurring expense
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.toggleRecurringExpense = async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found",
            });
        }

        // Make sure user owns this expense
        if (expense.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Not authorized",
            });
        }

        if (!expense.isRecurring) {
            return res.status(400).json({
                success: false,
                message: "This is not a recurring expense",
            });
        }

        // Flip the isActive flag
        expense.isActive = !expense.isActive;
        await expense.save();

        res.status(200).json({
            success: true,
            message: `Recurring expense ${expense.isActive ? "activated" : "deactivated"} successfully`,
            data: expense,
        });
    } catch (error) {
        next(error);
    }
};