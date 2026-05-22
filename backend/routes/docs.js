const express = require("express");
const router = express.Router();
const apiDocs = require("../docs/apiDocs");

const methodClass = {
    GET: "get",
    POST: "post",
    PUT: "put",
    DELETE: "delete",
};

const escapeHtml = (value) =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const codeBlock = (value) => {
    if (!value) return "";
    return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
};

const endpointHtml = (endpoint) => {
    const method = endpoint.method.toUpperCase();
    const authBadge = endpoint.auth
        ? '<span class="badge protected">Protected</span>'
        : '<span class="badge public">Public</span>';

    return `
        <article class="endpoint">
            <div class="endpoint-head">
                <div>
                    <span class="method ${methodClass[method] || "get"}">${method}</span>
                    <code>${escapeHtml(endpoint.path)}</code>
                </div>
                ${authBadge}
            </div>
            <p>${escapeHtml(endpoint.description)}</p>
            ${endpoint.query ? `<h4>Query Params</h4>${codeBlock(endpoint.query)}` : ""}
            ${endpoint.body ? `<h4>Body Example</h4>${codeBlock(endpoint.body)}` : ""}
        </article>
    `;
};

const docsHtml = () => `
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(apiDocs.name)} Documentation</title>
    <style>
        :root {
            color-scheme: light;
            --bg: #f8fafc;
            --panel: #ffffff;
            --text: #111827;
            --muted: #64748b;
            --border: #e5e7eb;
            --primary: #4f46e5;
            --green: #059669;
            --yellow: #d97706;
            --red: #dc2626;
            --blue: #2563eb;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            background: var(--bg);
            color: var(--text);
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            line-height: 1.5;
        }
        header {
            background: #111827;
            color: white;
            padding: 48px 24px;
        }
        .wrap {
            width: min(1120px, calc(100% - 32px));
            margin: 0 auto;
        }
        h1 {
            margin: 0;
            font-size: clamp(32px, 5vw, 56px);
            letter-spacing: -0.03em;
        }
        h2 { margin: 0 0 8px; font-size: 24px; }
        h3 { margin: 0; font-size: 18px; }
        h4 { margin: 16px 0 8px; font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }
        p { margin: 8px 0 0; color: var(--muted); }
        header p { color: #cbd5e1; max-width: 760px; }
        main { padding: 28px 0 56px; }
        .grid {
            display: grid;
            gap: 16px;
        }
        .summary {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            margin-bottom: 24px;
        }
        .card, .group, .endpoint {
            background: var(--panel);
            border: 1px solid var(--border);
            border-radius: 16px;
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
        }
        .card { padding: 20px; }
        .group {
            overflow: hidden;
            margin-top: 18px;
        }
        .group-head {
            padding: 20px;
            border-bottom: 1px solid var(--border);
        }
        .endpoint {
            margin: 14px;
            padding: 16px;
            box-shadow: none;
        }
        .endpoint-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }
        code {
            font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
            font-size: 14px;
            color: #0f172a;
            word-break: break-word;
        }
        pre {
            overflow-x: auto;
            margin: 0;
            padding: 14px;
            border-radius: 12px;
            background: #0f172a;
            color: #e5e7eb;
            font-size: 13px;
        }
        .method, .badge {
            display: inline-flex;
            align-items: center;
            margin-right: 10px;
            border-radius: 999px;
            padding: 5px 10px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.04em;
        }
        .get { background: #dbeafe; color: var(--blue); }
        .post { background: #dcfce7; color: var(--green); }
        .put { background: #fef3c7; color: var(--yellow); }
        .delete { background: #fee2e2; color: var(--red); }
        .protected { background: #eef2ff; color: var(--primary); margin-right: 0; }
        .public { background: #ecfdf5; color: var(--green); margin-right: 0; }
        .links {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 22px;
        }
        a {
            color: inherit;
            text-decoration: none;
        }
        .link {
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 999px;
            padding: 10px 14px;
            color: white;
            font-weight: 700;
        }
        @media (max-width: 760px) {
            .summary { grid-template-columns: 1fr; }
            .endpoint-head { align-items: flex-start; flex-direction: column; }
        }
    </style>
</head>
<body>
    <header>
        <div class="wrap">
            <h1>${escapeHtml(apiDocs.name)}</h1>
            <p>Version ${escapeHtml(apiDocs.version)}. A practical API reference for the SmartSpend AI Powered Expense Management System.</p>
            <div class="links">
                <a class="link" href="/api/health">Health Check</a>
                <a class="link" href="/api/docs.json">JSON Docs</a>
            </div>
        </div>
    </header>
    <main class="wrap">
        <section class="grid summary">
            <div class="card">
                <h3>Base URL</h3>
                <p><code>${escapeHtml(apiDocs.baseUrl)}</code></p>
            </div>
            <div class="card">
                <h3>Authentication</h3>
                <p>${escapeHtml(apiDocs.auth.header)}</p>
            </div>
            <div class="card">
                <h3>Response Format</h3>
                <p>All endpoints use <code>success</code>, <code>message</code>, and either <code>data</code> or <code>error</code>.</p>
            </div>
        </section>

        ${apiDocs.groups.map((group) => `
            <section class="group">
                <div class="group-head">
                    <h2>${escapeHtml(group.name)}</h2>
                    <p>${escapeHtml(group.description)}</p>
                </div>
                ${group.endpoints.map(endpointHtml).join("")}
            </section>
        `).join("")}
    </main>
</body>
</html>
`;

router.get("/docs", (req, res) => {
    res.type("html").send(docsHtml());
});

router.get("/docs.json", (req, res) => {
    res.status(200).json({
        success: true,
        message: "API documentation fetched successfully",
        data: apiDocs,
    });
});

module.exports = router;
