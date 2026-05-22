import API from "./axios";

// ─── Get budget + comparison ─────────────────────────────────────────
export const getBudget = async () => {
    const response = await API.get("/budget");
    return response.data;
};

// ─── Set or update budget ────────────────────────────────────────────
export const setBudget = async (budgetData) => {
    const response = await API.post("/budget", budgetData);
    return response.data;
};