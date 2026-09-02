import { assert, describe, test } from "vitest";
import { FormulaEvaluator } from "./FormulaEvaluator.ts";

// See also evaluatePointsFormula.test.ts

describe("min/max", () => {
	test("min works", () => {
		const formulaEvaluator = new FormulaEvaluator("min(x,y)", ["x", "y"], []);
		assert.equal(formulaEvaluator.evaluate({ x: 5, y: 10 }), 5);

		const formulaEvaluator2 = new FormulaEvaluator("min(x, y)", ["x", "y"], []);
		assert.equal(formulaEvaluator2.evaluate({ x: 50, y: 10 }), 10);
	});

	test("max works", () => {
		const formulaEvaluator = new FormulaEvaluator("max(x,y)", ["x", "y"], []);
		assert.equal(formulaEvaluator.evaluate({ x: 5, y: 10 }), 10);

		const formulaEvaluator2 = new FormulaEvaluator("max(x, y)", ["x", "y"], []);
		assert.equal(formulaEvaluator2.evaluate({ x: 50, y: 10 }), 50);
	});

	test("constant parameter", () => {
		const formulaEvaluator = new FormulaEvaluator("min(x,2)", ["x"], []);
		assert.equal(formulaEvaluator.evaluate({ x: 5 }), 2);

		const formulaEvaluator2 = new FormulaEvaluator("min(5, 4)", [], []);
		assert.equal(formulaEvaluator2.evaluate({}), 4);
	});

	test("variable named min", () => {
		const formulaEvaluator = new FormulaEvaluator("2*min", ["min"], []);
		assert.equal(formulaEvaluator.evaluate({ min: 4 }), 8);
	});

	test("not enough parameters", () => {
		assert.throws(() => {
			new FormulaEvaluator("min(x)", ["x"], []);
		}, "min requires exactly 2 parameters");
	});

	test("too many parameters", () => {
		assert.throws(() => {
			new FormulaEvaluator("min(x, y, z)", ["x", "y", "z"], []);
		}, "Invalid expression: too many values");
	});

	test("variable starting with a number", () => {
		const formulaEvaluator = new FormulaEvaluator("2pp+5", ["2pp"], []);
		assert.equal(formulaEvaluator.evaluate({ "2pp": 4 }), 9);
	});
});

describe("abs", () => {
	test("with positive variable", () => {
		const formulaEvaluator = new FormulaEvaluator("abs(min)", ["min"], []);
		assert.equal(formulaEvaluator.evaluate({ min: 4 }), 4);
	});

	test("with negative variable", () => {
		const formulaEvaluator = new FormulaEvaluator("abs(min)", ["min"], []);
		assert.equal(formulaEvaluator.evaluate({ min: -4 }), 4);
	});

	test("with positive constant", () => {
		const formulaEvaluator = new FormulaEvaluator("abs(2)", [], []);
		assert.equal(formulaEvaluator.evaluate({}), 2);
	});

	test("with negative constant", () => {
		const formulaEvaluator = new FormulaEvaluator("abs(-2)", [], []);
		assert.equal(formulaEvaluator.evaluate({}), 2);
	});

	test("not enough parameters", () => {
		assert.throws(() => {
			new FormulaEvaluator("abs()", [], []);
		}, "abs requires exactly 1 parameter");
	});

	test("too many parameters", () => {
		assert.throws(() => {
			new FormulaEvaluator("abs(x, y)", ["x", "y"], []);
		}, "Invalid expression: too many values");
	});
});

test("usedSymbols", () => {
	const formulaEvaluator = new FormulaEvaluator(
		"a+b+c+4+min(1,2)",
		["a", "b", "c", "d"],
		[],
	);
	assert.deepStrictEqual(
		formulaEvaluator.usedVariables,
		new Set(["a", "b", "c"]),
	);
});

test("default 0 if undefined", () => {
	const formulaEvaluator = new FormulaEvaluator("x+5", ["x"], []);
	assert.equal(formulaEvaluator.evaluate({}), 5);
});

describe("nested variables", () => {
	test("works", () => {
		const formulaEvaluator = new FormulaEvaluator("a.b", ["a"], ["a"]);
		assert.deepStrictEqual(formulaEvaluator.usedVariables, new Set(["a"]));
		assert.equal(
			formulaEvaluator.evaluate({
				a: {
					b: 6,
				},
			}),
			6,
		);
	});

	test("works in a function", () => {
		const formulaEvaluator = new FormulaEvaluator(
			"a.b+b+min(2,a.c)",
			["a", "b"],
			["a"],
		);
		assert.deepStrictEqual(formulaEvaluator.usedVariables, new Set(["a", "b"]));
		assert.equal(
			formulaEvaluator.evaluate({
				a: {
					b: 6,
					c: 1,
				},
				b: 3,
			}),
			10,
		);
	});

	test("0 for undefined property", () => {
		const formulaEvaluator = new FormulaEvaluator("a.b", ["a"], ["a"]);
		assert.equal(formulaEvaluator.evaluate({ a: {} }), 0);
	});

	test("error for direct access when nested", () => {
		assert.throws(() => {
			new FormulaEvaluator("x", ["x"], ["x"]);
		}, 'Cannot use variable "x" without nesting (like "x.foo")');
	});

	test("error for nested access of number", () => {
		assert.throws(() => {
			new FormulaEvaluator("x.a", ["x"], []);
		}, 'Cannot use variable "x" with nesting (like "x.foo")');
	});

	test("error for inconsistent direct access", () => {
		assert.throws(() => {
			new FormulaEvaluator("x.a+x", ["x"], []);
		}, 'Cannot use variable "x" with nesting (like "x.foo")');
	});
});
