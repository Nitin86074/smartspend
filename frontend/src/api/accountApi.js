import API from "./axios";

// ─── Get all accounts ────────────────────────────────────────────────
export const getAccounts = async () => {
    const response = await API.get("/accounts");
    return response.data;
};

// ─── Create account ──────────────────────────────────────────────────
export const createAccount = async (data) => {
    const response = await API.post("/accounts", data);
    return response.data;
};

// ─── Transfer funds ──────────────────────────────────────────────────
export const transferFunds = async (data) => {
    const response = await API.post("/accounts/transfer", data);
    return response.data;
};