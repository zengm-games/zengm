import { assert, test } from "vitest";
import { getGameSpread } from "./getGameSpread.ts";

test("uses football coefficients", () => {
	assert.closeTo(
		getGameSpread({
			homeCourtAdvantage: 1,
			neutral: false,
			numPeriods: 4,
			ovrs: [60, 50],
			quarterLength: 15,
		}),
		6,
		1e-9,
	);
});
