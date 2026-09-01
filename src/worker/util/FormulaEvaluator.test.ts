import { assert, describe, test } from "vitest";
import FormulaEvaluator from "./FormulaEvaluator.ts";
// See also evaluatePointsFormula.test.ts

describe("min/max", () => {
	test("min works", () => {
		const formulaEvaluator = new FormulaEvaluator("min(x,y)", ["x", "y"]);
		assert.equal(formulaEvaluator.evaluate({ x: 5, y: 10 }), 5);

		const formulaEvaluator2 = new FormulaEvaluator("min(x, y)", ["x", "y"]);
		assert.equal(formulaEvaluator2.evaluate({ x: 50, y: 10 }), 10);
	});

	test("max works", () => {
		const formulaEvaluator = new FormulaEvaluator("max(x,y)", ["x", "y"]);
		assert.equal(formulaEvaluator.evaluate({ x: 5, y: 10 }), 10);

		const formulaEvaluator2 = new FormulaEvaluator("max(x, y)", ["x", "y"]);
		assert.equal(formulaEvaluator2.evaluate({ x: 50, y: 10 }), 50);
	});

	test("constant parameter", () => {
		const formulaEvaluator = new FormulaEvaluator("min(x,2)", ["x"]);
		assert.equal(formulaEvaluator.evaluate({ x: 5 }), 2);

		const formulaEvaluator2 = new FormulaEvaluator("min(5, 4)", []);
		assert.equal(formulaEvaluator2.evaluate({}), 4);
	});

	test("variable named min", () => {
		const formulaEvaluator = new FormulaEvaluator("2*min", ["min"]);
		assert.equal(formulaEvaluator.evaluate({ min: 4 }), 8);
	});

	test("not enough parameters", () => {
		assert.throws(() => {
			new FormulaEvaluator("min(x)", ["x"]);
		}, "min requires exactly 2 parameters");
	});

	test("too many parameters", () => {
		assert.throws(() => {
			new FormulaEvaluator("min(x, y, z)", ["x", "y", "z"]);
		}, "min requires exactly 2 parameters");
	});

	test("variable starting with a number", () => {
		const formulaEvaluator = new FormulaEvaluator("2pp+5", ["2pp"]);
		assert.equal(formulaEvaluator.evaluate({ "2pp": 4 }), 9);
	});
});

describe("abs", () => {
	test("with positive variable", () => {
		const formulaEvaluator = new FormulaEvaluator("abs(min)", ["min"]);
		assert.equal(formulaEvaluator.evaluate({ min: 4 }), 4);
	});

	test("with negative variable", () => {
		const formulaEvaluator = new FormulaEvaluator("abs(min)", ["min"]);
		assert.equal(formulaEvaluator.evaluate({ min: -4 }), 4);
	});

	test("with positive constant", () => {
		const formulaEvaluator = new FormulaEvaluator("abs(2)", []);
		assert.equal(formulaEvaluator.evaluate({}), 2);
	});

	test("with negative constant", () => {
		const formulaEvaluator = new FormulaEvaluator("abs(-2)", []);
		assert.equal(formulaEvaluator.evaluate({}), 2);
	});

	test("not enough parameters", () => {
		assert.throws(() => {
			new FormulaEvaluator("abs()", []);
		}, "abs requires exactly 1 parameter");
	});

	test("too many parameters", () => {
		assert.throws(() => {
			new FormulaEvaluator("abs(x, y)", ["x", "y"]);
		}, "abs requires exactly 1 parameter");
	});
});

test("usedSymbols", () => {
	const formulaEvaluator = new FormulaEvaluator("a+b+c+4+min(1,2)", [
		"a",
		"b",
		"c",
		"d",
	]);
	assert.deepStrictEqual(
		formulaEvaluator.usedVariables,
		new Set(["a", "b", "c"]),
	);
});
