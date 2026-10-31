import { assert, test } from "vitest";
import { getLoginErrorMessage } from "./getLoginErrorMessage.ts";

const genericMessage = "Invalid username, email, or password.";

test("returns the generic message when the server sends no errors", () => {
	assert.strictEqual(getLoginErrorMessage({}), genericMessage);
});

test("returns the generic message when errors is empty", () => {
	assert.strictEqual(getLoginErrorMessage({ errors: {} }), genericMessage);
});

test("returns the server's username error when there is one", () => {
	assert.strictEqual(
		getLoginErrorMessage({ errors: { username: "Use your username." } }),
		"Use your username.",
	);
});
