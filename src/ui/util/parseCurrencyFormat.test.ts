import { assert, test } from "vitest";
import { parseCurrencyFormat } from "./parseCurrencyFormat.ts";

test("works", () => {
	assert.deepStrictEqual(parseCurrencyFormat("$x.y"), {
		append: "",
		decimalSeparator: ".",
		prepend: "$",
	});
	assert.deepStrictEqual(parseCurrencyFormat("$ x.y"), {
		append: "",
		decimalSeparator: ".",
		prepend: "$ ",
	});
	assert.deepStrictEqual(parseCurrencyFormat("$x.yF"), {
		append: "F",
		decimalSeparator: ".",
		prepend: "$",
	});
	assert.deepStrictEqual(parseCurrencyFormat("$x,y"), {
		append: "",
		decimalSeparator: ",",
		prepend: "$",
	});
});

test("no output for invalid currencyFormat", () => {
	assert.strictEqual(parseCurrencyFormat("$xy"), undefined);
});
