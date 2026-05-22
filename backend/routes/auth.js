const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const {
    register,
    verifyOtp,
    login,
    googleAuth,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    logout,
    getMe,
    updateProfile,
    changePassword,
    deleteAccount,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

// ─── Validation Rules ─────────────────────────────────────────────────
const registerValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Name is required")
        .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email")
        .trim()
        .isEmail().withMessage("Please enter a valid email")
        .custom((value) => value.toLowerCase().endsWith("@gmail.com"))
        .withMessage("Registration requires a @gmail.com address")
        .normalizeEmail(),
    body("password")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const verifyOtpValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Name is required")
        .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email")
        .trim()
        .isEmail().withMessage("Please enter a valid email")
        .custom((value) => value.toLowerCase().endsWith("@gmail.com"))
        .withMessage("Registration requires a @gmail.com address")
        .normalizeEmail(),
    body("password")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("otp")
        .trim()
        .isLength({ min: 6, max: 6 }).withMessage("Verification code must be 6 digits")
        .isNumeric().withMessage("Verification code must contain only numbers"),
];

const loginValidation = [
    body("email")
        .trim()
        .isEmail().withMessage("Please enter a valid email")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("Password is required"),
];

const updateProfileValidation = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
    body("currency")
        .optional()
        .trim()
        .isLength({ min: 3, max: 3 }).withMessage("Currency must be a 3-letter code")
        .isAlpha().withMessage("Currency must contain only letters")
        .toUpperCase(),
    body("monthlyBudget")
        .optional()
        .isFloat({ min: 0 }).withMessage("Monthly budget must be 0 or more"),
];

const googleAuthValidation = [
    body("credential")
        .notEmpty().withMessage("Google credential is required"),
];

const verifyEmailValidation = [
    body("email")
        .trim()
        .isEmail().withMessage("Please enter a valid email")
        .normalizeEmail(),
    body("code")
        .trim()
        .isLength({ min: 6, max: 6 }).withMessage("Verification code must be 6 digits")
        .isNumeric().withMessage("Verification code must contain only numbers"),
];

const resendVerificationValidation = [
    body("email")
        .trim()
        .isEmail().withMessage("Please enter a valid email")
        .normalizeEmail(),
];

const forgotPasswordValidation = [
    body("email")
        .trim()
        .isEmail().withMessage("Please enter a valid email")
        .normalizeEmail(),
];

const resetPasswordValidation = [
    body("email")
        .trim()
        .isEmail().withMessage("Please enter a valid email")
        .normalizeEmail(),
    body("code")
        .trim()
        .isLength({ min: 6, max: 6 }).withMessage("Reset code must be 6 digits")
        .isNumeric().withMessage("Reset code must contain only numbers"),
    body("password")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

const changePasswordValidation = [
    body("currentPassword")
        .notEmpty().withMessage("Current password is required"),
    body("newPassword")
        .isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

const deleteAccountValidation = [
    body("confirmation")
        .trim()
        .notEmpty().withMessage("Confirmation is required"),
    body("password")
        .optional()
        .isString().withMessage("Password must be text"),
];

// ─── Routes ───────────────────────────────────────────────────────────
router.post("/register", registerValidation, validate, register);
router.post("/verify-otp", verifyOtpValidation, validate, verifyOtp);
router.post("/login", loginValidation, validate, login);
router.post("/google", googleAuthValidation, validate, googleAuth);
router.post("/verify-email", verifyEmailValidation, validate, verifyEmail);
router.post("/resend-verification", resendVerificationValidation, validate, resendVerification);
router.post("/forgot-password", forgotPasswordValidation, validate, forgotPassword);
router.post("/reset-password", resetPasswordValidation, validate, resetPassword);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/update-profile", protect, updateProfileValidation, validate, updateProfile);
router.put("/change-password", protect, changePasswordValidation, validate, changePassword);
router.delete("/delete-account", protect, deleteAccountValidation, validate, deleteAccount);

module.exports = router;
