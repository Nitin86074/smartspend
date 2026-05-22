const { Parser } = require("json2csv");

// ─────────────────────────────────────────────────────────────────────
// Helper: Format expenses for export
// ─────────────────────────────────────────────────────────────────────
const formatExpensesForExport = (expenses) => {
    return expenses.map((exp) => ({
        Title: exp.title,
        Amount: exp.amount,
        Category: exp.category,
        "Payment Method": exp.paymentMethod,
        Date: new Date(exp.date).toLocaleDateString("en-IN"),
        Notes: exp.notes || "",
        "Is Recurring": exp.isRecurring ? "Yes" : "No",
        "Recurring Frequency": exp.recurringFrequency || "N/A",
    }));
};

// ─────────────────────────────────────────────────────────────────────
// Helper: Generate CSV string from expenses
// ─────────────────────────────────────────────────────────────────────
const generateCSV = (expenses) => {
    const fields = [
        "Title",
        "Amount",
        "Category",
        "Payment Method",
        "Date",
        "Notes",
        "Is Recurring",
        "Recurring Frequency",
    ];

    const data = formatExpensesForExport(expenses);
    const parser = new Parser({ fields });
    return parser.parse(data);
};

module.exports = { generateCSV };