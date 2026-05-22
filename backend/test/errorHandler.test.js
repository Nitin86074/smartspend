const assert = require("node:assert/strict");
const test = require("node:test");
const errorHandler = require("../middleware/errorHandler");

test("errorHandler returns consistent API error shape", () => {
    const req = {
        method: "GET",
        originalUrl: "/api/example",
    };
    const res = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };

    errorHandler(new Error("Boom"), req, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.success, false);
    assert.equal(res.body.message, "Boom");
    assert.equal(res.body.error.code, "SERVER_ERROR");
});
