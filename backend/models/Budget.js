const mongoose = require("mongoose");

// Each category can have its own budget limit
const CategoryBudgetSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            enum: [
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
            ],
        },
        limit: {
            type: Number,
            required: true,
            min: [1, "Budget limit must be at least 1"],
        },
    },
    { _id: false } // no separate id needed for sub-documents
);

const BudgetSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // one budget document per user
        },
        monthlyLimit: {
            type: Number,
            required: [true, "Monthly budget limit is required"],
            min: [1, "Monthly limit must be at least 1"],
        },
        categoryBudgets: {
            type: [CategoryBudgetSchema],
            default: [],
        },
        month: {
            type: Number, // 1-12
            required: true,
        },
        year: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Budget", BudgetSchema);