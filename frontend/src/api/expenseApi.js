import API from "./axios";

// ─── Get all expenses with filters ───────────────────────────────────
export const getExpenses = async (params = {}) => {
    const response = await API.get("/expenses", { params });
    return response.data;
};

// ─── Add new expense ─────────────────────────────────────────────────
export const addExpense = async (expenseData) => {
    const response = await API.post("/expenses", expenseData);
    return response.data;
};

// ─── Update expense ──────────────────────────────────────────────────
export const updateExpense = async (id, expenseData) => {
    const response = await API.put(`/expenses/${id}`, expenseData);
    return response.data;
};

// ─── Delete expense ──────────────────────────────────────────────────
export const deleteExpense = async (id) => {
    const response = await API.delete(`/expenses/${id}`);
    return response.data;
};

// ─── Get expense stats ───────────────────────────────────────────────
export const getExpenseStats = async () => {
    const response = await API.get("/expenses/stats/summary");
    return response.data;
};

// ─── Get recurring expenses ──────────────────────────────────────────
export const getRecurringExpenses = async () => {
    const response = await API.get("/expenses/recurring");
    return response.data;
};

// ─── Add recurring expense ───────────────────────────────────────────
export const addRecurringExpense = async (data) => {
    const response = await API.post("/expenses/recurring", data);
    return response.data;
};

// Toggle recurring expense active/inactive status
export const toggleRecurringExpense = async (id) => {
    const response = await API.put(`/expenses/recurring/${id}/toggle`);
    return response.data;
};
