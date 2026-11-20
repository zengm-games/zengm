import { assert, test } from "vitest";
import { getWinProbability } from "./gamePrediction.ts";

// The fitted live model made late leads less accurate in baseball, so it keeps leads on average
test("a lead is kept on average", () => {
	const prob = getWinProbability({
		frac: 0.25,
		margin: 1,
		sigma: 3,
		spread: 0,
	});
	const normalCdf = (x: number) =>
		0.5 * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3)));
	assert.closeTo(prob, normalCdf(1 / (3 * Math.sqrt(0.25))), 2e-3);
});
