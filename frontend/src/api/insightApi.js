import API from "./axios";

// ─── Get smart insights ──────────────────────────────────────────────
export const getInsights = async () => {
    const response = await API.get("/insights");
    return response.data;
};