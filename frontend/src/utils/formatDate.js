// ─── Format date to readable format ──────────────────────────────────
export const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

// ─── Format date for input fields (YYYY-MM-DD) ────────────────────────
export const formatDateForInput = (date) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
};

// ─── Get relative time (e.g. "2 days ago") ───────────────────────────
export const getRelativeTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return formatDate(date);
};

// ─── Get month name from number ───────────────────────────────────────
export const getMonthName = (monthNum) => {
    const months = [
        "January", "February", "March", "April",
        "May", "June", "July", "August",
        "September", "October", "November", "December",
    ];
    return months[monthNum - 1] || "";
};