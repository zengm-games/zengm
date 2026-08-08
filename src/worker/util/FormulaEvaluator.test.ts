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
		const formulaEvaluator = new FormulaEvaluator("min(x)", ["x"]);
		assert.throws(() => {
			formulaEvaluator.evaluate({ x: 5 });
		}, "min/max requires exactly two parameters");
	});

	test("too many parameters", () => {
		const formulaEvaluator = new FormulaEvaluator("min(x, y, z)", [
			"x",
			"y",
			"z",
		]);
		assert.throws(() => {
			formulaEvaluator.evaluate({ x: 5, y: 6, z: 7 });
		}, "min/max requires exactly two parameters");
	});
});
