const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        name: {
            type: String,
            required: [true, "Account name is required"],
            trim: true,
            maxlength: [50, "Account name cannot exceed 50 characters"],
        },
        accountType: {
            type: String,
            required: [true, "Account type is required"],
            enum: ["cash", "bank", "upi", "credit_card", "other"],
            default: "cash",
        },
        balance: {
            type: Number,
            required: [true, "Opening balance is required"],
            default: 0,
        },
        color: {
            type: String,
            default: "#6366f1", // default indigo color
        },
        icon: {
            type: String,
            default: "wallet",
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Only one default account per user
AccountSchema.index({ user: 1, isDefault: 1 });

module.exports = mongoose.model("Account", AccountSchema);