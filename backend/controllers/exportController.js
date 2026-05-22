const Expense = require("../models/Expense");
const Income = require("../models/Income");
const { generateCSV } = require("../utils/exportHelper");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/export/csv
// @desc    Export expenses as CSV file
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.exportCSV = async (req, res, next) => {
    try {
        const {
            category,
            startDate,
            endDate,
            paymentMethod,
        } = req.query;

        // ── Build filter ──
        const filter = { user: req.user.id };

        if (category && category !== "All") {
            // Decode URI in case it was encoded
            filter.category = decodeURIComponent(category);
        }
        if (paymentMethod && paymentMethod !== "All") {
            filter.paymentMethod = paymentMethod;
        }
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.date.$lte = end;
            }
        }

        // ── Fetch expenses ──
        const expenses = await Expense.find(filter)
            .sort({ date: -1 })
            .lean();

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No expenses found to export",
            });
        }

        // ── Generate CSV ──
        const csv = generateCSV(expenses);

        // ── Set headers to trigger file download ──
        const fileName = `smartspend_expenses_${Date.now()}.csv`;
        res.setHeader("Content-Type", "text/csv");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        res.status(200).send(csv);
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────────────────
// @route   GET /api/export/pdf
// @desc    Export expenses as PDF report
// @access  Private
// ─────────────────────────────────────────────────────────────────────
exports.exportPDF = async (req, res, next) => {
    try {
        const { category, startDate, endDate } = req.query;

        // ── Build filter ──
        const filter = { user: req.user.id };
        if (category && category !== "All") filter.category = category;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.date.$lte = end;
            }
        }

        // ── Fetch data ──
        const expenses = await Expense.find(filter)
            .sort({ date: -1 })
            .lean();

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No expenses found to export",
            });
        }

        // ── Calculate summary ──
        const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

        const categoryTotals = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});

        // ── Create PDF ──
        const doc = new PDFDocument({ margin: 40, size: "A4" });

        // Set headers to trigger download
        const fileName = `smartspend_report_${Date.now()}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
        );

        // Pipe PDF to response
        doc.pipe(res);

        // ── PDF Header ──
        doc
            .fontSize(24)
            .fillColor("#6366f1")
            .text("SmartSpend", { align: "center" });

        doc
            .fontSize(14)
            .fillColor("#374151")
            .text("Expense Report", { align: "center" });

        doc
            .fontSize(10)
            .fillColor("#6b7280")
            .text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, {
                align: "center",
            });

        doc.moveDown(1);

        // ── Divider line ──
        doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .strokeColor("#e5e7eb")
            .stroke();

        doc.moveDown(1);

        // ── Summary Section ──
        doc
            .fontSize(14)
            .fillColor("#111827")
            .text("Summary", { underline: true });

        doc.moveDown(0.5);

        doc
            .fontSize(11)
            .fillColor("#374151")
            .text(`Total Expenses: ${expenses.length}`)
            .text(`Total Amount: ₹${totalAmount.toLocaleString("en-IN")}`)
            .text(
                `Date Range: ${startDate
                    ? new Date(startDate).toLocaleDateString("en-IN")
                    : "All time"
                } - ${endDate
                    ? new Date(endDate).toLocaleDateString("en-IN")
                    : "Today"
                }`
            );

        doc.moveDown(1);

        // ── Category Breakdown ──
        doc
            .fontSize(14)
            .fillColor("#111827")
            .text("Category Breakdown", { underline: true });

        doc.moveDown(0.5);

        Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .forEach(([cat, amt]) => {
                const percentage = Math.round((amt / totalAmount) * 100);
                doc
                    .fontSize(10)
                    .fillColor("#374151")
                    .text(`${cat}: ₹${amt.toLocaleString("en-IN")} (${percentage}%)`);
            });

        doc.moveDown(1);

        // ── Divider ──
        doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .strokeColor("#e5e7eb")
            .stroke();

        doc.moveDown(1);

        // ── Expense Table Header ──
        doc
            .fontSize(14)
            .fillColor("#111827")
            .text("Expense Details", { underline: true });

        doc.moveDown(0.5);

        // Table header row
        doc.fontSize(9).fillColor("#6366f1");
        doc.text("Date", 40, doc.y, { width: 80, continued: true });
        doc.text("Title", 120, doc.y, { width: 160, continued: true });
        doc.text("Category", 280, doc.y, { width: 120, continued: true });
        doc.text("Method", 400, doc.y, { width: 80, continued: true });
        doc.text("Amount", 480, doc.y, { width: 75, align: "right" });

        doc.moveDown(0.3);

        // Divider under header
        doc
            .moveTo(40, doc.y)
            .lineTo(555, doc.y)
            .strokeColor("#6366f1")
            .stroke();

        doc.moveDown(0.3);

        // ── Expense Rows ──
        expenses.forEach((exp, index) => {
            // Alternate row background
            if (index % 2 === 0) {
                doc
                    .rect(40, doc.y - 2, 515, 16)
                    .fillColor("#f9fafb")
                    .fill();
            }

            doc.fontSize(9).fillColor("#374151");
            const y = doc.y;
            doc.text(
                new Date(exp.date).toLocaleDateString("en-IN"),
                40, y,
                { width: 80, continued: true }
            );
            doc.text(
                exp.title.length > 22 ? exp.title.substring(0, 22) + "..." : exp.title,
                120, y,
                { width: 160, continued: true }
            );
            doc.text(exp.category, 280, y, { width: 120, continued: true });
            doc.text(exp.paymentMethod || "Cash", 400, y, {
                width: 80,
                continued: true,
            });
            doc.text(`₹${exp.amount.toLocaleString("en-IN")}`, 480, y, {
                width: 75,
                align: "right",
            });

            doc.moveDown(0.6);

            // Add new page if near bottom
            if (doc.y > 750) {
                doc.addPage();
            }
        });

        doc.moveDown(1);

        // ── Footer ──
        doc
            .fontSize(9)
            .fillColor("#9ca3af")
            .text("Generated by SmartSpend — AI Powered Expense Manager", {
                align: "center",
            });

        // Finalize PDF
        doc.end();
    } catch (error) {
        next(error);
    }
};