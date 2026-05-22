import API from "./axios";

// ─── Get all income ──────────────────────────────────────────────────
export const getIncome = async (params = {}) => {
    const response = await API.get("/income", { params });
    return response.data;
};

// ─── Add income ──────────────────────────────────────────────────────
export const addIncome = async (incomeData) => {
    const response = await API.post("/income", incomeData);
    return response.data;
};

// ─── Delete income ───────────────────────────────────────────────────
export const deleteIncome = async (id) => {
    const response = await API.delete(`/income/${id}`);
    return response.data;
};