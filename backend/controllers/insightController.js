const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Budget = require("../models/Budget");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/insights
// @desc    Get smart spending insights for the user
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.getInsights = async (req, res, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);
        const now = new Date();

        // ── Date ranges ───────────────────────────────────────────────────
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfThisMonth.setHours(23, 59, 59, 999);

        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        endOfLastMonth.setHours(23, 59, 59, 999);

        // ── Run all DB queries in parallel ────────────────────────────────
        const [
            thisMonthExpenses,
            lastMonthExpenses,
            thisMonthIncome,
            categoryBreakdown,
            lastMonthCategory,
            budget,
            recentExpenses,
        ] = await Promise.all([

            // This month total spending
            Expense.aggregate([
                {
                    $match: {
                        user: userId,
                        date: { $gte: startOfThisMonth, $lte: endOfThisMonth },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),

            // Last month total spending
            Expense.aggregate([
                {
                    $match: {
                        user: userId,
                        date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
            ]),

            // This month income
            Income.aggregate([
                {
                    $match: {
                        user: userId,
                        date: { $gte: startOfThisMonth, $lte: endOfThisMonth },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$amount" },
                    },
                },
            ]),

            // This month category breakdown
            Expense.aggregate([
                {
                    $match: {
                        user: userId,
                        date: { $gte: startOfThisMonth, $lte: endOfThisMonth },
                    },
                },
                {
                    $group: {
                        _id: "$category",
                        total: { $sum: "$amount" },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { total: -1 } },
            ]),

            // Last month category breakdown
            Expense.aggregate([
                {
                    $match: {
                        user: userId,
                        date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
                    },
                },
                {
                    $group: {
                        _id: "$category",
                        total: { $sum: "$amount" },
                    },
                },
            ]),

            // User budget
            Budget.findOne({ user: req.user.id }),

            // Last 5 expenses
            Expense.find({ user: req.user.id })
                .sort({ date: -1 })
                .limit(5)
                .lean(),
        ]);

        // ── Extract values ────────────────────────────────────────────────
        const thisMonthTotal = thisMonthExpenses[0]?.total || 0;
        const thisMonthCount = thisMonthExpenses[0]?.count || 0;
        const lastMonthTotal = lastMonthExpenses[0]?.total || 0;
        const thisMonthIncomeTotal = thisMonthIncome[0]?.total || 0;

        // ── Month over month comparison ───────────────────────────────────
        let monthComparison = {
            thisMonth: thisMonthTotal,
            lastMonth: lastMonthTotal,
            difference: thisMonthTotal - lastMonthTotal,
            percentageChange: 0,
            trend: "same",
        };

        if (lastMonthTotal > 0) {
            const change =
                ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
            monthComparison.percentageChange = Math.abs(Math.round(change));
            monthComparison.trend =
                thisMonthTotal > lastMonthTotal
                    ? "increased"
                    : thisMonthTotal < lastMonthTotal
                        ? "decreased"
                        : "same";
        }

        // ── Highest spending category ─────────────────────────────────────
        const highestCategory = categoryBreakdown[0] || null;

        // ── Daily average spending ────────────────────────────────────────
        const daysPassedInMonth = now.getDate();
        const dailyAverage =
            daysPassedInMonth > 0
                ? Math.round(thisMonthTotal / daysPassedInMonth)
                : 0;

        // ── Projected monthly spending ────────────────────────────────────
        const totalDaysInMonth = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0
        ).getDate();
        const projectedMonthly = Math.round(dailyAverage * totalDaysInMonth);

        // ── Budget health score (0-100) ───────────────────────────────────
        let budgetHealth = null;
        if (budget) {
            const usagePercent = (thisMonthTotal / budget.monthlyLimit) * 100;
            const score = Math.max(0, Math.round(100 - usagePercent));
            budgetHealth = {
                score,
                limit: budget.monthlyLimit,
                spent: thisMonthTotal,
                remaining: Math.max(0, budget.monthlyLimit - thisMonthTotal),
                status:
                    score >= 70 ? "excellent" : score >= 40 ? "moderate" : "critical",
            };
        }

        // ── Balance this month ────────────────────────────────────────────
        const balance = thisMonthIncomeTotal - thisMonthTotal;

        // ── Category comparison with last month ───────────────────────────
        const categoryInsights = categoryBreakdown.map((cat) => {
            const lastMonth = lastMonthCategory.find((l) => l._id === cat._id);
            const lastMonthAmt = lastMonth?.total || 0;
            const diff = cat.total - lastMonthAmt;
            const pctChange =
                lastMonthAmt > 0 ? Math.round((diff / lastMonthAmt) * 100) : null;

            return {
                category: cat._id,
                thisMonth: cat.total,
                lastMonth: lastMonthAmt,
                difference: diff,
                percentageChange: pctChange,
                trend:
                    diff > 0 ? "increased" : diff < 0 ? "decreased" : "same",
            };
        });

        // ── Generate smart saving suggestions ────────────────────────────
        const suggestions = generateSuggestions({
            thisMonthTotal,
            lastMonthTotal,
            highestCategory,
            balance,
            budget,
            projectedMonthly,
            categoryBreakdown,
        });

        // ── Final response ────────────────────────────────────────────────
        res.status(200).json({
            success: true,
            message: "Insights fetched successfully",
            data: {
                thisMonth: {
                    total: thisMonthTotal,
                    count: thisMonthCount,
                    income: thisMonthIncomeTotal,
                    balance,
                    dailyAverage,
                    projectedMonthly,
                    balanceStatus: balance >= 0 ? "surplus" : "deficit",
                },
                monthComparison,
                highestSpendingCategory: highestCategory
                    ? {
                        category: highestCategory._id,
                        amount: highestCategory.total,
                        transactions: highestCategory.count,
                    }
                    : null,
                categoryInsights,
                budgetHealth,
                recentExpenses,
                suggestions,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// Helper: Generate saving suggestions based on data
// ─────────────────────────────────────────────────────────────────────
const generateSuggestions = ({
    thisMonthTotal,
    lastMonthTotal,
    highestCategory,
    balance,
    budget,
    projectedMonthly,
    categoryBreakdown,
}) => {
    const suggestions = [];

    // Suggestion 1: Spending increased vs last month
    if (thisMonthTotal > lastMonthTotal && lastMonthTotal > 0) {
        const increase = Math.round(
            ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        );
        suggestions.push({
            type: "warning",
            icon: "📈",
            title: "Spending Increased",
            message: `Your spending is up ${increase}% compared to last month. Try to identify and cut unnecessary expenses.`,
        });
    }

    // Suggestion 2: Highest spending category alert
    if (highestCategory && thisMonthTotal > 0) {
        const percentage = Math.round(
            (highestCategory.total / thisMonthTotal) * 100
        );
        if (percentage > 40) {
            suggestions.push({
                type: "alert",
                icon: "⚠️",
                title: `High ${highestCategory._id} Spending`,
                message: `${highestCategory._id} takes up ${percentage}% of your total spending this month. Consider setting a category budget for it.`,
            });
        }
    }

    // Suggestion 3: Deficit warning
    if (balance < 0) {
        suggestions.push({
            type: "danger",
            icon: "🚨",
            title: "Spending Exceeds Income",
            message: `You are spending more than you earn this month. Reduce expenses or add more income sources.`,
        });
    }

    // Suggestion 4: Budget will be exceeded
    if (budget && projectedMonthly > budget.monthlyLimit) {
        suggestions.push({
            type: "warning",
            icon: "🎯",
            title: "Budget Overrun Predicted",
            message: `At your current spending rate, you will spend ₹${projectedMonthly.toLocaleString()} this month, exceeding your ₹${budget.monthlyLimit.toLocaleString()} budget.`,
        });
    }

    // Suggestion 5: Doing well
    if (balance > 0 && suggestions.length === 0) {
        suggestions.push({
            type: "success",
            icon: "✅",
            title: "Great Financial Health",
            message: `You have a surplus of ₹${balance.toLocaleString()} this month. Consider saving or investing the extra amount.`,
        });
    }

    // Suggestion 6: Entertainment spending check
    const entertainmentSpend = categoryBreakdown.find(
        (c) => c._id === "Entertainment"
    );
    if (entertainmentSpend && thisMonthTotal > 0) {
        const pct = Math.round(
            (entertainmentSpend.total / thisMonthTotal) * 100
        );
        if (pct > 20) {
            suggestions.push({
                type: "tip",
                icon: "💡",
                title: "Entertainment Spending Tip",
                message: `Entertainment is ${pct}% of your spending. Look for free or cheaper alternatives for some activities.`,
            });
        }
    }

    return suggestions;
};