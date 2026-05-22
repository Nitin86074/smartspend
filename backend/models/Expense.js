const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        amount: {
            type: Number,
            required: [true, "Amount is required"],
            min: [0.01, "Amount must be greater than 0"],
        },
        category: {
            type: String,
            required: [true, "Category is required"],
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
            default: "Other",
        },
        paymentMethod: {
            type: String,
            enum: ["Cash", "Credit Card", "Debit Card", "UPI", "Net Banking", "Other"],
            default: "Cash",
        },
        date: {
            type: Date,
            required: [true, "Date is required"],
            default: Date.now,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, "Notes cannot exceed 500 characters"],
        },

        // ── Recurring Expense Fields ──────────────────────────────────────
        isRecurring: {
            type: Boolean,
            default: false,
        },
        recurringFrequency: {
            type: String,
            enum: ["daily", "weekly", "monthly", "none"],
            default: "none",
        },
        nextDueDate: {
            type: Date,
            default: null,
        },
        isActive: {
            type: Boolean,
            default: true, // can deactivate a recurring expense
        },
    },
    {
        timestamps: true,
    }
);

// ─── Index for faster queries ─────────────────────────────────────────
ExpenseSchema.index({ user: 1, date: -1 });
ExpenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model("Expense", ExpenseSchema);