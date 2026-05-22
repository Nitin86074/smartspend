import API from "./axios";

// ─── Register new user ────────────────────────────────────────────────
export const registerUser = async (userData) => {
    const response = await API.post("/auth/register", userData);
    return response.data;
};

// ─── Login user ───────────────────────────────────────────────────────
export const loginUser = async (credentials) => {
    const response = await API.post("/auth/login", credentials);
    return response.data;
};

// Login/register with Google verified email
export const googleAuth = async (credential) => {
    const response = await API.post("/auth/google", { credential });
    return response.data;
};

export const verifyEmail = async (data) => {
    const response = await API.post("/auth/verify-email", data);
    return response.data;
};

export const verifyOtp = async (data) => {
    const response = await API.post("/auth/verify-otp", data);
    return response.data;
};

export const resendVerification = async (email) => {
    const response = await API.post("/auth/resend-verification", { email });
    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await API.post("/auth/forgot-password", { email });
    return response.data;
};

export const resetPassword = async (data) => {
    const response = await API.post("/auth/reset-password", data);
    return response.data;
};

// ─── Get current logged in user ───────────────────────────────────────
export const logoutUser = async () => {
    const response = await API.post("/auth/logout");
    return response.data;
};

export const getMe = async () => {
    const response = await API.get("/auth/me");
    return response.data;
};

// ─── Update profile ───────────────────────────────────────────────────
export const updateProfile = async (data) => {
    const response = await API.put("/auth/update-profile", data);
    return response.data;
};

export const changePassword = async (data) => {
    const response = await API.put("/auth/change-password", data);
    return response.data;
};

export const deleteAccount = async (data) => {
    const response = await API.delete("/auth/delete-account", { data });
    return response.data;
};
