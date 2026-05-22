const mongoose = require("mongoose");

const IncomeSchema = new mongoose.Schema(
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
            min: [1, "Amount must be at least 1"],
        },
        category: {
            type: String,
            enum: [
                "Salary",
                "Freelance",
                "Business",
                "Investment",
                "Rental",
                "Gift",
                "Other",
            ],
            default: "Salary",
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
        isRecurring: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
IncomeSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model("Income", IncomeSchema);