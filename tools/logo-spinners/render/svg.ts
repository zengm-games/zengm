// Helpers for writing compact SVG. Sprite sheets repeat every frame, so small
// savings per shape add up.

export type Pt = [number, number];

// Coordinates are stored as integers in units of 10^-decimals. With 1 decimal
// in the logos' viewBox units (roughly 100-350 wide), that's far below a pixel
// at any size the logo is shown.

// An integer in units of 10^-decimals as the shortest number string, e.g. with
// 1 decimal: 12 -> "1.2", -5 -> "-.5", 30 -> "3"
const scaledToString = (n: number, decimals: 0 | 1) => {
	if (decimals === 0) {
		return String(n);
	}
	const sign = n < 0 ? "-" : "";
	const abs = Math.abs(n);
	const int = Math.floor(abs / 10);
	const frac = abs % 10;
	if (frac === 0) {
		return `${sign}${int}`;
	}
	return `${sign}${int === 0 ? "" : int}.${frac}`;
};

// Join numbers, skipping the separator where SVG doesn't need one (before a
// minus sign)
const joinNumbers = (nums: string[]) => {
	let out = "";
	for (const num of nums) {
		out += out === "" || num.startsWith("-") ? num : ` ${num}`;
	}
	return out;
};

// Path data for polylines, using relative commands. Coordinate pairs after an
// "m" are implicit relative line-tos, so no "l" commands are needed.
export const pathData = (
	polylines: Pt[][],
	{ closed = false, decimals = 1 }: { closed?: boolean; decimals?: 0 | 1 } = {},
) => {
	const factor = 10 ** decimals;
	const toScaled = (v: number) => Math.round(v * factor);

	let d = "";
	// Current point, scaled
	let x = 0;
	let y = 0;
	for (const points of polylines) {
		if (points.length === 0) {
			continue;
		}
		const nums = [];
		for (const [px, py] of points) {
			const nx = toScaled(px);
			const ny = toScaled(py);
			nums.push(
				scaledToString(nx - x, decimals),
				scaledToString(ny - y, decimals),
			);
			x = nx;
			y = ny;
		}
		d += `m${joinNumbers(nums)}`;
		if (closed) {
			d += "z";
			// Closing moves the current point back to the start of the subpath
			x = toScaled(points[0]![0]);
			y = toScaled(points[0]![1]);
		}
	}
	return d;
};

// Number for an attribute, rounded without trailing zeros
export const num = (v: number, decimals: number = 2) => {
	const factor = 10 ** decimals;
	return String(Math.round(v * factor) / factor);
};
