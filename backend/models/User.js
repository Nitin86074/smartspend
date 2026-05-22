const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
            maxlength: [50, "Name cannot exceed 50 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email",
            ],
        },
        password: {
            type: String,
            required: function () {
                return this.authProvider === "local";
            },
            minlength: [6, "Password must be at least 6 characters"],
            select: false,
        },
        authProvider: {
            type: String,
            enum: ["local", "google"],
            default: "local",
        },
        googleId: {
            type: String,
            default: null,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationCode: {
            type: String,
            select: false,
            default: null,
        },
        emailVerificationExpires: {
            type: Date,
            select: false,
            default: null,
        },
        passwordResetCode: {
            type: String,
            select: false,
            default: null,
        },
        passwordResetExpires: {
            type: Date,
            select: false,
            default: null,
        },
        currency: {
            type: String,
            default: "INR",
        },
        monthlyBudget: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// ─── Hash password before saving ─────────────────────────────────────
UserSchema.pre("save", async function () {
    if (!this.password || !this.isModified("password")) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// ─── Method: Compare password ─────────────────────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Method: Generate JWT ─────────────────────────────────────────────
UserSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { id: this._id, email: this.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

module.exports = mongoose.model("User", UserSchema);
