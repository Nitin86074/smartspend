const Account = require("../models/Account");
const Expense = require("../models/Expense");
const Income = require("../models/Income");
const ErrorResponse = require("../utils/errorResponse");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/accounts
// @desc    Create a new account
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.createAccount = async (req, res, next) => {
    try {
        const { name, accountType, balance, color, icon, isDefault } = req.body;

        if (!name || !accountType) {
            return res.status(400).json({
                success: false,
                message: "Account name and type are required",
            });
        }

        // If this account is set as default,
        // remove default from all other accounts first
        if (isDefault) {
            await Account.updateMany(
                { user: req.user.id },
                { isDefault: false }
            );
        }

        // Check if this is the first account — make it default automatically
        const accountCount = await Account.countDocuments({ user: req.user.id });
        const shouldBeDefault = isDefault || accountCount === 0;

        const account = await Account.create({
            user: req.user.id,
            name,
            accountType,
            balance: balance || 0,
            color: color || "#6366f1",
            icon: icon || "wallet",
            isDefault: shouldBeDefault,
        });

        res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: account,
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/accounts
// @desc    Get all accounts with balance summary
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.getAccounts = async (req, res, next) => {
    try {
        const accounts = await Account.find({
            user: req.user.id,
            isActive: true,
        }).sort({ isDefault: -1, createdAt: 1 });

        // Calculate total balance across all accounts
        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

        // Account type summary
        const typeSummary = accounts.reduce((acc, account) => {
            if (!acc[account.accountType]) {
                acc[account.accountType] = {
                    count: 0,
                    totalBalance: 0,
                };
            }
            acc[account.accountType].count += 1;
            acc[account.accountType].totalBalance += account.balance;
            return acc;
        }, {});

        res.status(200).json({
            success: true,
            message: "Accounts fetched successfully",
            data: {
                accounts,
                summary: {
                    totalAccounts: accounts.length,
                    totalBalance,
                    typeSummary,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   PUT /api/accounts/:id
// @desc    Update an account
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.updateAccount = async (req, res, next) => {
    try {
        let account = await Account.findById(req.params.id);

        if (!account) {
            return next(new ErrorResponse("Account not found", 404));
        }

        if (account.user.toString() !== req.user.id) {
            return next(new ErrorResponse("Not authorized", 401));
        }

        // If setting as default, remove default from others
        if (req.body.isDefault) {
            await Account.updateMany(
                { user: req.user.id },
                { isDefault: false }
            );
        }

        account = await Account.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Account updated successfully",
            data: account,
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   DELETE /api/accounts/:id
// @desc    Deactivate an account (soft delete)
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.deleteAccount = async (req, res, next) => {
    try {
        const account = await Account.findById(req.params.id);

        if (!account) {
            return next(new ErrorResponse("Account not found", 404));
        }

        if (account.user.toString() !== req.user.id) {
            return next(new ErrorResponse("Not authorized", 401));
        }

        // Don't allow deleting the default account
        if (account.isDefault) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete default account. Set another account as default first.",
            });
        }

        // Soft delete — just mark as inactive
        account.isActive = false;
        await account.save();

        res.status(200).json({
            success: true,
            message: "Account deleted successfully",
            data: {},
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   POST /api/accounts/transfer
// @desc    Transfer balance between two accounts
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.transferFunds = async (req, res, next) => {
    try {
        const { fromAccountId, toAccountId, amount, notes } = req.body;

        // Validation
        if (!fromAccountId || !toAccountId || !amount) {
            return res.status(400).json({
                success: false,
                message: "fromAccountId, toAccountId and amount are required",
            });
        }

        if (fromAccountId === toAccountId) {
            return res.status(400).json({
                success: false,
                message: "Cannot transfer to the same account",
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Transfer amount must be greater than 0",
            });
        }

        // Find both accounts
        const [fromAccount, toAccount] = await Promise.all([
            Account.findById(fromAccountId),
            Account.findById(toAccountId),
        ]);

        if (!fromAccount || !toAccount) {
            return res.status(404).json({
                success: false,
                message: "One or both accounts not found",
            });
        }

        // Make sure both accounts belong to this user
        if (
            fromAccount.user.toString() !== req.user.id ||
            toAccount.user.toString() !== req.user.id
        ) {
            return next(new ErrorResponse("Not authorized", 401));
        }

        // Check sufficient balance
        if (fromAccount.balance < amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Available: ₹${fromAccount.balance}`,
            });
        }

        // Perform transfer
        fromAccount.balance -= amount;
        toAccount.balance += amount;

        await Promise.all([fromAccount.save(), toAccount.save()]);

        res.status(200).json({
            success: true,
            message: `₹${amount} transferred from ${fromAccount.name} to ${toAccount.name}`,
            data: {
                fromAccount: {
                    name: fromAccount.name,
                    newBalance: fromAccount.balance,
                },
                toAccount: {
                    name: toAccount.name,
                    newBalance: toAccount.balance,
                },
                transferAmount: amount,
            },
        });
    } catch (error) {
        next(error);
    }
};