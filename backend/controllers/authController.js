const { OAuth2Client } = require("google-auth-library");
const { validationResult } = require("express-validator");
const Account = require("../models/Account");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const OTP = require("../models/OTP");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const { sendPasswordResetEmail, sendVerificationEmail } = require("../utils/email");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateVerificationCode = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_OTP_ATTEMPTS = 3;

const isGmailAddress = (email) => email.toLowerCase().endsWith("@gmail.com");

const setVerificationCode = (user) => {
    user.emailVerificationCode = generateVerificationCode();
    user.emailVerificationExpires = new Date(Date.now() + 10 * 60 * 1000);
};

const setPasswordResetCode = (user) => {
    user.passwordResetCode = generateVerificationCode();
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
};

const getCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: process.env.COOKIE_SAMESITE || "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
    };
};

const buildUserPayload = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    monthlyBudget: user.monthlyBudget,
    authProvider: user.authProvider,
    isEmailVerified: user.isEmailVerified,
});

const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();

    res.cookie("smartspend_token", token, getCookieOptions());

    res.status(statusCode).json({
        success: true,
        user: buildUserPayload(user),
    });
};

exports.register = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
            });
        }

        const { name, email, password } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        if (!isGmailAddress(normalizedEmail)) {
            return next(new ErrorResponse("Registration requires a @gmail.com address", 400));
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return next(new ErrorResponse("Email already registered", 400));
        }

        const pendingOtp = await OTP.findOne({ email: normalizedEmail }).select(
            "+otp +attempts +lastSentAt"
        );

        if (pendingOtp) {
            const canResendAt = pendingOtp.lastSentAt.getTime() + RESEND_COOLDOWN_MS;

            if (canResendAt > Date.now()) {
                return next(
                    new ErrorResponse(
                        `Please wait ${Math.ceil((canResendAt - Date.now()) / 1000)} seconds before requesting another code`,
                        429
                    )
                );
            }
        }

        const otp = generateVerificationCode();

        await OTP.findOneAndUpdate(
            { email: normalizedEmail },
            {
                email: normalizedEmail,
                otp,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
                attempts: 0,
                lastSentAt: new Date(),
            },
            { new: true, upsert: true, runValidators: true }
        );

        await sendVerificationEmail({
            email: normalizedEmail,
            name,
            code: otp,
        });

        res.status(pendingOtp ? 200 : 201).json({
            success: true,
            message: pendingOtp
                ? "New verification code sent to your Gmail."
                : "Verification code sent to your Gmail.",
            data: {
                email: normalizedEmail,
                requiresVerification: true,
                expiresInMinutes: 5,
                resendAfterSeconds: 30,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyOtp = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
            });
        }

        const { name, email, password, otp } = req.body;
        const normalizedEmail = email.toLowerCase().trim();

        if (!isGmailAddress(normalizedEmail)) {
            return next(new ErrorResponse("Registration requires a @gmail.com address", 400));
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            await OTP.deleteOne({ email: normalizedEmail });
            return next(new ErrorResponse("Email already registered", 400));
        }

        const pendingOtp = await OTP.findOne({ email: normalizedEmail }).select(
            "+otp +attempts"
        );

        if (!pendingOtp) {
            return next(new ErrorResponse("Verification code expired. Please request a new one.", 400));
        }

        if (pendingOtp.expiresAt.getTime() < Date.now()) {
            await pendingOtp.deleteOne();
            return next(new ErrorResponse("Verification code expired. Please request a new one.", 400));
        }

        if (pendingOtp.attempts >= MAX_OTP_ATTEMPTS) {
            await pendingOtp.deleteOne();
            return next(new ErrorResponse("Too many incorrect attempts. Please request a new code.", 429));
        }

        if (pendingOtp.otp !== otp) {
            pendingOtp.attempts += 1;

            const attemptsLeft = MAX_OTP_ATTEMPTS - pendingOtp.attempts;

            if (attemptsLeft <= 0) {
                await pendingOtp.deleteOne();
            } else {
                await pendingOtp.save();
            }

            return next(
                new ErrorResponse(
                    attemptsLeft > 0
                        ? `Invalid verification code. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} left.`
                        : "Too many incorrect attempts. Please request a new code.",
                    attemptsLeft > 0 ? 400 : 429
                )
            );
        }

        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            authProvider: "local",
            isEmailVerified: true,
        });

        await pendingOtp.deleteOne();

        sendTokenResponse(user, 201, res);
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
            });
        }

        const { email, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail }).select("+password");

        if (!user) {
            return next(new ErrorResponse("Invalid credentials", 401));
        }

        if (user.authProvider === "google") {
            return next(new ErrorResponse("Please continue with Google for this account", 401));
        }

        if (!user.isEmailVerified) {
            return next(new ErrorResponse("Please verify your Gmail before signing in", 403));
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return next(new ErrorResponse("Invalid credentials", 401));
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.logout = (req, res) => {
    const { maxAge, ...cookieOptions } = getCookieOptions();
    res.clearCookie("smartspend_token", cookieOptions);

    res.status(200).json({
        success: true,
        message: "Logged out successfully.",
    });
};

exports.googleAuth = async (req, res, next) => {
    try {
        const { credential } = req.body;

        if (!process.env.GOOGLE_CLIENT_ID) {
            return next(new ErrorResponse("Google login is not configured", 500));
        }

        if (!credential) {
            return next(new ErrorResponse("Google credential is required", 400));
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();

        if (!payload?.email || !payload.email_verified) {
            return next(new ErrorResponse("Google email is not verified", 401));
        }

        const email = payload.email.toLowerCase();
        const name = payload.name || email.split("@")[0];

        let user = await User.findOne({ email }).select("+password");

        if (user) {
            user.googleId = payload.sub;
            user.authProvider = user.authProvider || "google";
            user.isEmailVerified = true;
            await user.save();
        } else {
            user = await User.create({
                name,
                email,
                googleId: payload.sub,
                authProvider: "google",
                isEmailVerified: true,
            });
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(new ErrorResponse("Google authentication failed", 401));
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { email, code } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail }).select(
            "+emailVerificationCode +emailVerificationExpires"
        );

        if (!user) {
            return next(new ErrorResponse("User not found", 404));
        }

        if (user.isEmailVerified) {
            return sendTokenResponse(user, 200, res);
        }

        const isExpired =
            !user.emailVerificationExpires ||
            user.emailVerificationExpires.getTime() < Date.now();

        if (
            isExpired ||
            !user.emailVerificationCode ||
            user.emailVerificationCode !== code
        ) {
            return next(new ErrorResponse("Invalid or expired verification code", 400));
        }

        user.isEmailVerified = true;
        user.emailVerificationCode = null;
        user.emailVerificationExpires = null;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail }).select(
            "+emailVerificationCode +emailVerificationExpires"
        );

        if (!user) {
            return next(new ErrorResponse("User not found", 404));
        }

        if (user.isEmailVerified) {
            return res.status(200).json({
                success: true,
                message: "Gmail is already verified.",
            });
        }

        setVerificationCode(user);
        await user.save();

        await sendVerificationEmail({
            email: user.email,
            name: user.name,
            code: user.emailVerificationCode,
        });

        res.status(200).json({
            success: true,
            message: "New verification code sent to your Gmail.",
        });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail }).select(
            "+passwordResetCode +passwordResetExpires"
        );

        if (!user) {
            return next(new ErrorResponse("No account found with this email", 404));
        }

        if (user.authProvider === "google") {
            return next(new ErrorResponse("This account uses Google login. Please continue with Google.", 400));
        }

        if (!user.isEmailVerified) {
            return next(new ErrorResponse("Please verify your Gmail before resetting password", 403));
        }

        setPasswordResetCode(user);
        await user.save();

        await sendPasswordResetEmail({
            email: user.email,
            name: user.name,
            code: user.passwordResetCode,
        });

        res.status(200).json({
            success: true,
            message: "Password reset code sent to your Gmail.",
            data: {
                email: user.email,
                codeExpiresInMinutes: 10,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const { email, code, password } = req.body;
        const normalizedEmail = email.toLowerCase();

        const user = await User.findOne({ email: normalizedEmail }).select(
            "+password +passwordResetCode +passwordResetExpires"
        );

        if (!user) {
            return next(new ErrorResponse("No account found with this email", 404));
        }

        if (user.authProvider === "google") {
            return next(new ErrorResponse("This account uses Google login. Please continue with Google.", 400));
        }

        const isExpired =
            !user.passwordResetExpires ||
            user.passwordResetExpires.getTime() < Date.now();

        if (isExpired || !user.passwordResetCode || user.passwordResetCode !== code) {
            return next(new ErrorResponse("Invalid or expired password reset code", 400));
        }

        user.password = password;
        user.passwordResetCode = null;
        user.passwordResetExpires = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successfully. Please login with your new password.",
        });
    } catch (error) {
        next(error);
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            user: {
                ...buildUserPayload(user),
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { name, currency, monthlyBudget } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name, currency, monthlyBudget },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            user: buildUserPayload(user),
        });
    } catch (error) {
        next(error);
    }
};

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id).select(
            "+password +passwordResetCode +passwordResetExpires"
        );

        if (!user) {
            return next(new ErrorResponse("User not found", 404));
        }

        if (user.authProvider === "google") {
            return next(new ErrorResponse("Google accounts do not have a SmartSpend password. Use Google account security settings.", 400));
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return next(new ErrorResponse("Current password is incorrect", 401));
        }

        const isSamePassword = await user.matchPassword(newPassword);
        if (isSamePassword) {
            return next(new ErrorResponse("New password must be different from current password", 400));
        }

        user.password = newPassword;
        user.passwordResetCode = null;
        user.passwordResetExpires = null;
        await user.save();

        sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.deleteAccount = async (req, res, next) => {
    try {
        const { password, confirmation } = req.body;

        const user = await User.findById(req.user.id).select("+password");

        if (!user) {
            return next(new ErrorResponse("User not found", 404));
        }

        if (user.authProvider === "google") {
            if (confirmation !== user.email) {
                return next(new ErrorResponse("Type your email address to confirm account deletion", 400));
            }
        } else {
            if (confirmation !== "DELETE") {
                return next(new ErrorResponse("Type DELETE to confirm account deletion", 400));
            }

            if (!password) {
                return next(new ErrorResponse("Password is required to delete account", 400));
            }

            const isMatch = await user.matchPassword(password);
            if (!isMatch) {
                return next(new ErrorResponse("Password is incorrect", 401));
            }
        }

        await Promise.all([
            Account.deleteMany({ user: user._id }),
            Budget.deleteMany({ user: user._id }),
            Expense.deleteMany({ user: user._id }),
            Income.deleteMany({ user: user._id }),
        ]);

        await user.deleteOne();

        const { maxAge, ...cookieOptions } = getCookieOptions();
        res.clearCookie("smartspend_token", cookieOptions);

        res.status(200).json({
            success: true,
            message: "Account deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};
