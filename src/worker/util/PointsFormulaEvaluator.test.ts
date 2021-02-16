import assert from "assert";
import PointsFormulaEvaluator from "./PointsFormulaEvaluator";

describe("worker/util/PointsFormulaEvaluator", () => {
	test("works for a normal formula", () => {
		const evaluator = new PointsFormulaEvaluator("2*W + OTL + T");
		assert.strictEqual(
			evaluator.evaluate({
				W: 5,
				L: 15,
				OTL: 1,
				T: 2,
			}),
			13,
		);

		assert.strictEqual(
			evaluator.evaluate({
				W: 1,
				L: 1000,
				OTL: 15,
				T: 0,
			}),
			17,
		);
	});

	test("error for invalid variable", () => {
		assert.throws(
			() => {
				new PointsFormulaEvaluator("1+2*W+OTL+Q");
			},
			{
				message: 'Invalid variable "Q"',
			},
		);

		assert.throws(
			() => {
				new PointsFormulaEvaluator("aBc+5");
			},
			{
				message: 'Invalid variable "aBc"',
			},
		);
	});

	test("error for invalid syntax", () => {
		assert.throws(() => {
			new PointsFormulaEvaluator("+-+");
		});
	});

	test("error for mismatched parentheses", () => {
		assert.throws(
			() => {
				new PointsFormulaEvaluator("2*W+(OTL+T");
			},
			{
				message: "Mismatched parentheses",
			},
		);
	});
});
