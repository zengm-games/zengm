import { assert, test } from "vitest";
import { defaultGameAttributes } from "./defaultGameAttributes.ts";
import { getGameSpread } from "./getGameSpread.ts";

test("uses baseball coefficients", () => {
	assert.closeTo(
		getGameSpread({
			homeCourtAdvantage: 1,
			neutral: false,
			numPeriods: defaultGameAttributes.numPeriods,
			ovrs: [60, 50],
			quarterLength: defaultGameAttributes.quarterLength,
		}),
		2,
		1e-9,
	);
});
