import { afterEach, expect, test } from "vitest";
import { resetG } from "../../../test/helpers.ts";
import g from "../../util/g.ts";
import fuzzOvrs from "./fuzzOvrs.ts";
import fuzzRating from "./fuzzRating.ts";

afterEach(resetG);

test.each([
	{ godMode: false, userTids: [0] },
	{ godMode: true, userTids: [0] },
	{ godMode: false, userTids: [0, 1] },
])(
	"positional fuzz respects no-fuzz modes with $godMode and $userTids",
	({ godMode, userTids }) => {
		resetG();
		g.setWithoutSavingToDB("godMode", godMode);
		g.setWithoutSavingToDB("userTids", userTids);
		const input = {
			SP: -10,
			RP: 100,
			C: 42.7,
			"1B": Number.NaN,
			"2B": Infinity,
		};
		for (const fuzz of [-10.5, 7.5, Infinity, 0, -0, Number.NaN]) {
			const expected = { ...input };
			// Current master returns an untouched copy in God/Multi Team Mode,
			// and treats NaN fuzz as an active input outside those modes.
			if (fuzz !== 0 && !godMode && userTids.length <= 1) {
				for (const key of Object.keys(expected)) {
					expected[key as keyof typeof expected] = fuzzRating(
						expected[key as keyof typeof expected],
						fuzz,
					);
				}
			}
			const result = fuzzOvrs(input, fuzz);
			expect(result).toEqual(expected);
			expect(result).not.toBe(input);
		}
		expect(input).toEqual({
			SP: -10,
			RP: 100,
			C: 42.7,
			"1B": Number.NaN,
			"2B": Infinity,
		});
	},
);

test("handles ratings before league attributes exist", () => {
	resetG();
	Reflect.deleteProperty(g, "userTids");
	Reflect.deleteProperty(g, "godMode");
	expect(fuzzOvrs({ C: 99.9, W: 1 }, 4)).toEqual({ C: 100, W: 5 });
	expect(fuzzOvrs(undefined, 4)).toBeUndefined();
});
