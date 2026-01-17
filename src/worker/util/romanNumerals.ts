// Technically there should be an upper bound at 3999 but that's no fun

export const toRoman = (num: number): string => {
	if (num <= 0 || Number.isNaN(num)) {
		throw new RangeError("Number must be positive");
	}

	const map: [number, string][] = [
		[1000, "M"],
		[900, "CM"],
		[500, "D"],
		[400, "CD"],
		[100, "C"],
		[90, "XC"],
		[50, "L"],
		[40, "XL"],
		[10, "X"],
		[9, "IX"],
		[5, "V"],
		[4, "IV"],
		[1, "I"],
	];

	let result = "";

	for (const [value, numeral] of map) {
		while (num >= value) {
			result += numeral;
			num -= value;
		}
	}

	return result;
};

// This doens't validate order of characters, but wahtever
type RomanChar = "M" | "D" | "C" | "L" | "X" | "V" | "I";
export type RomanNumeral = `${RomanChar | Lowercase<RomanChar>}`;

export const isValidRomanNumeral = (roman: string): roman is RomanNumeral => {
	const valid = /^(m*)(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/i;
	return valid.test(roman);
};

export const fromRoman = (roman: RomanNumeral): number => {
	const map = {
		M: 1000,
		D: 500,
		C: 100,
		L: 50,
		X: 10,
		V: 5,
		I: 1,
	};

	let total = 0;
	let prev = 0;

	const romanUpper = roman.toUpperCase();

	for (let i = romanUpper.length - 1; i >= 0; i--) {
		const char = romanUpper[i] as RomanChar;
		const value = map[char];

		if (value < prev) {
			total -= value;
		} else {
			total += value;
		}
		prev = value;
	}

	return total;
};
