import { assert, test } from "vitest";
import { fromRoman, isValidRomanNumeral, toRoman } from "./romanNumerals.ts";

const valid = [
	["I", 1],
	["IV", 4],
	["VIII", 8],
	["XV", 15],
	["XVI", 16],
	["XXIII", 23],
	["XLII", 42],
	["LXXXIV", 84],
	["C", 100],
	["ccLVI", 256],
	["dxii", 512],
	["MXXiv", 1024],
	["MMXLVIII", 2048],
	["MMMCMXCIX", 3999],
	["MMMM", 4000],
	["MMMMMMMMMCMXCIX", 9999],
] as const;

const invalidRoman = ["foo", "MMORPG", "CCCC"];
const invalidArabic = [0, -1, Number.NaN];

test("isValidRomanNumeral", () => {
	for (const [roman] of valid) {
		assert.strictEqual(isValidRomanNumeral(roman), true);
	}

	for (const roman of invalidRoman) {
		assert.strictEqual(isValidRomanNumeral(roman), false);
	}
});

test("fromRoman", () => {
	for (const [roman, arabic] of valid) {
		if (isValidRomanNumeral(roman)) {
			assert.strictEqual(fromRoman(roman), arabic);
		}
	}
});

test("toRoman", () => {
	for (const [roman, arabic] of valid) {
		assert.strictEqual(toRoman(arabic), roman.toUpperCase());
	}

	for (const arabic of invalidArabic) {
		assert.throws(() => {
			toRoman(arabic);
		}, RangeError);
	}
});
