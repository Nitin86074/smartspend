const assert = require("node:assert/strict");
const test = require("node:test");
const ErrorResponse = require("../utils/errorResponse");

test("ErrorResponse stores message and status code", () => {
    const error = new ErrorResponse("Invalid credentials", 401);

    assert.equal(error.message, "Invalid credentials");
    assert.equal(error.statusCode, 401);
    assert.ok(error.stack);
});
