import API from "./axios";

const getFileName = (headers, fallback) => {
    const disposition = headers?.["content-disposition"];
    const match = disposition?.match(/filename="?([^"]+)"?/);
    return match?.[1] || fallback;
};

const downloadBlob = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

const throwBlobError = async (error, fallbackMessage) => {
    const blob = error?.response?.data;

    if (blob instanceof Blob) {
        try {
            const text = await blob.text();
            const parsed = JSON.parse(text);
            throw new Error(parsed.message || parsed.error || fallbackMessage);
        } catch (parseError) {
            if (parseError instanceof SyntaxError) {
                throw new Error(fallbackMessage, { cause: parseError });
            }

            throw parseError;
        }
    }

    throw error;
};

export const exportCSV = async (params = {}) => {
    try {
        const response = await API.get("/export/csv", {
            params,
            responseType: "blob",
        });

        downloadBlob(
            new Blob([response.data], { type: "text/csv" }),
            getFileName(response.headers, `smartspend_expenses_${Date.now()}.csv`)
        );
    } catch (error) {
        await throwBlobError(error, "CSV export failed.");
    }
};

export const exportPDF = async (params = {}) => {
    try {
        const response = await API.get("/export/pdf", {
            params,
            responseType: "blob",
        });

        downloadBlob(
            new Blob([response.data], { type: "application/pdf" }),
            getFileName(response.headers, `smartspend_report_${Date.now()}.pdf`)
        );
    } catch (error) {
        await throwBlobError(error, "PDF export failed.");
    }
};
