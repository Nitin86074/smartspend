const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            unique: true,
        },
        otp: {
            type: String,
            required: [true, "OTP is required"],
            select: false,
        },
        expiresAt: {
            type: Date,
            required: [true, "OTP expiry is required"],
            index: { expires: 0 },
        },
        attempts: {
            type: Number,
            default: 0,
            select: false,
        },
        lastSentAt: {
            type: Date,
            default: Date.now,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("OTP", OTPSchema);
