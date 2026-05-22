const apiDocs = {
    name: "SmartSpend API",
    version: "2.0.0",
    baseUrl: "/api",
    auth: {
        type: "HTTP-only Cookie",
        header: "Cookie: smartspend_token=<jwt>",
        note: "Browser clients receive a secure HTTP-only session cookie after login or Google auth. Authorization: Bearer <token> is still accepted for API tools and older clients.",
    },
    responseFormat: {
        success: {
            success: true,
            message: "Readable success message",
            data: {},
        },
        error: {
            success: false,
            message: "Readable error message",
            error: {
                code: "ERROR_CODE",
            },
        },
    },
    groups: [
        {
            name: "Health",
            description: "Check whether the API is running.",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/health",
                    auth: false,
                    description: "Returns API status, environment, version, and route groups.",
                },
            ],
        },
        {
            name: "Authentication",
            description: "Register, login, and read/update the current user profile.",
            endpoints: [
                {
                    method: "POST",
                    path: "/api/auth/register",
                    auth: false,
                    description: "Create a manual Gmail/password user and send a verification code.",
                    body: {
                        name: "John Doe",
                        email: "john@gmail.com",
                        password: "password123",
                    },
                },
                {
                    method: "POST",
                    path: "/api/auth/verify-email",
                    auth: false,
                    description: "Verify the 6 digit code sent to Gmail, then return a JWT.",
                    body: {
                        email: "john@gmail.com",
                        code: "123456",
                    },
                },
                {
                    method: "POST",
                    path: "/api/auth/resend-verification",
                    auth: false,
                    description: "Send a fresh Gmail verification code.",
                    body: {
                        email: "john@gmail.com",
                    },
                },
                {
                    method: "POST",
                    path: "/api/auth/login",
                    auth: false,
                    description: "Login with email/password and return a JWT.",
                    body: {
                        email: "john@example.com",
                        password: "password123",
                    },
                },
                {
                    method: "POST",
                    path: "/api/auth/google",
                    auth: false,
                    description: "Login or register with a Google-verified email using a Google ID token.",
                    body: {
                        credential: "google_id_token_from_frontend",
                    },
                },
                {
                    method: "GET",
                    path: "/api/auth/me",
                    auth: true,
                    description: "Get the currently logged-in user.",
                },
                {
                    method: "PUT",
                    path: "/api/auth/update-profile",
                    auth: true,
                    description: "Update profile preferences.",
                    body: {
                        name: "John Doe",
                        currency: "INR",
                        monthlyBudget: 25000,
                    },
                },
            ],
        },
        {
            name: "Expenses",
            description: "Create, read, update, delete, filter, and summarize expense data.",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/expenses",
                    auth: true,
                    description: "Get expenses with filtering, sorting, and pagination.",
                    query: {
                        page: 1,
                        limit: 10,
                        search: "grocery",
                        category: "Food & Dining",
                        paymentMethod: "UPI",
                        startDate: "2026-04-01",
                        endDate: "2026-04-30",
                        sortBy: "date",
                        order: "desc",
                    },
                },
                {
                    method: "POST",
                    path: "/api/expenses",
                    auth: true,
                    description: "Add a new expense.",
                    body: {
                        title: "Groceries",
                        amount: 1200,
                        category: "Food & Dining",
                        paymentMethod: "UPI",
                        date: "2026-04-25",
                        notes: "Weekly grocery run",
                    },
                },
                {
                    method: "GET",
                    path: "/api/expenses/:id",
                    auth: true,
                    description: "Get a single expense by id.",
                },
                {
                    method: "PUT",
                    path: "/api/expenses/:id",
                    auth: true,
                    description: "Update an expense.",
                },
                {
                    method: "DELETE",
                    path: "/api/expenses/:id",
                    auth: true,
                    description: "Delete an expense.",
                },
                {
                    method: "GET",
                    path: "/api/expenses/stats/summary",
                    auth: true,
                    description: "Get all-time totals, monthly totals, category breakdown, and monthly trend.",
                },
            ],
        },
        {
            name: "Recurring Expenses",
            description: "Manage repeated expenses such as subscriptions, bills, and rent.",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/expenses/recurring",
                    auth: true,
                    description: "Get all recurring expenses and estimated monthly cost.",
                },
                {
                    method: "POST",
                    path: "/api/expenses/recurring",
                    auth: true,
                    description: "Create a recurring expense.",
                    body: {
                        title: "Netflix",
                        amount: 499,
                        category: "Entertainment",
                        paymentMethod: "Credit Card",
                        recurringFrequency: "monthly",
                        notes: "Subscription",
                    },
                },
                {
                    method: "PUT",
                    path: "/api/expenses/recurring/:id/toggle",
                    auth: true,
                    description: "Activate or pause a recurring expense.",
                },
            ],
        },
        {
            name: "Income",
            description: "Track income entries and monthly income summary.",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/income",
                    auth: true,
                    description: "Get income records with pagination and date/category filters.",
                },
                {
                    method: "POST",
                    path: "/api/income",
                    auth: true,
                    description: "Add income.",
                    body: {
                        title: "Salary",
                        amount: 50000,
                        category: "Salary",
                        date: "2026-04-01",
                        notes: "April salary",
                        isRecurring: true,
                    },
                },
                {
                    method: "DELETE",
                    path: "/api/income/:id",
                    auth: true,
                    description: "Delete an income record.",
                },
            ],
        },
        {
            name: "Budget",
            description: "Set monthly and category budgets, then compare budget vs actual spending.",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/budget",
                    auth: true,
                    description: "Get budget, summary, category comparison, warnings, and exceeded status.",
                },
                {
                    method: "POST",
                    path: "/api/budget",
                    auth: true,
                    description: "Create or update the current user's budget.",
                    body: {
                        monthlyLimit: 30000,
                        categoryBudgets: [
                            {
                                category: "Food & Dining",
                                limit: 8000,
                            },
                        ],
                    },
                },
            ],
        },
        {
            name: "Insights",
            description: "Smart spending insights, category movement, budget health, and saving suggestions.",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/insights",
                    auth: true,
                    description: "Get smart insights for the logged-in user.",
                },
            ],
        },
        {
            name: "Accounts",
            description: "Multi-account system for wallets, bank accounts, and transfers.",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/accounts",
                    auth: true,
                    description: "Get all accounts.",
                },
                {
                    method: "POST",
                    path: "/api/accounts",
                    auth: true,
                    description: "Create an account.",
                },
                {
                    method: "PUT",
                    path: "/api/accounts/:id",
                    auth: true,
                    description: "Update an account.",
                },
                {
                    method: "DELETE",
                    path: "/api/accounts/:id",
                    auth: true,
                    description: "Delete an account.",
                },
                {
                    method: "POST",
                    path: "/api/accounts/transfer",
                    auth: true,
                    description: "Transfer money between accounts.",
                },
            ],
        },
        {
            name: "Export",
            description: "Download CSV and PDF reports.",
            endpoints: [
                {
                    method: "GET",
                    path: "/api/export/csv",
                    auth: true,
                    description: "Download expenses as a CSV file.",
                    query: {
                        category: "Food & Dining",
                        paymentMethod: "UPI",
                        startDate: "2026-04-01",
                        endDate: "2026-04-30",
                    },
                },
                {
                    method: "GET",
                    path: "/api/export/pdf",
                    auth: true,
                    description: "Download expenses as a PDF report.",
                    query: {
                        category: "Food & Dining",
                        startDate: "2026-04-01",
                        endDate: "2026-04-30",
                    },
                },
            ],
        },
    ],
};

module.exports = apiDocs;
