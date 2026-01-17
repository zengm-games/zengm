import { assert, test } from "vitest";
import { parseCurrencyFormat } from "./parseCurrencyFormat.ts";

test("works", () => {
	assert.deepStrictEqual(parseCurrencyFormat("$x.y"), ["$", ".", ""]);
	assert.deepStrictEqual(parseCurrencyFormat("$ x.y"), ["$ ", ".", ""]);
	assert.deepStrictEqual(parseCurrencyFormat("$x.yF"), ["$", ".", "F"]);
	assert.deepStrictEqual(parseCurrencyFormat("$x,y"), ["$", ",", ""]);
});

test("no output for invalid currencyFormat", () => {
	assert.strictEqual(parseCurrencyFormat("$xy"), undefined);
});
