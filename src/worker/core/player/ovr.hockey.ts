import { helpers } from "../../../worker/util";
import type { PlayerRatings, Position } from "../../../common/types.hockey";

const info = {
	C: {
		hgt: [1, 1],
		stre: [2, 1],
		spd: [4, 1],
		endu: [1, 1],
		pss: [4, 1],
		wst: [2, 1],
		sst: [2, 1],
		stk: [4, 1],
		oiq: [4, 1],
		chk: [2, 1],
		blk: [2, 1],
		fcf: [4, 1],
		diq: [2, 1],
	},
	W: {
		hgt: [1, 1],
		stre: [1, 1],
		spd: [1, 1],
		endu: [1, 1],
		pss: [1, 1],
		wst: [4, 1],
		sst: [4, 1],
		stk: [1, 1],
		oiq: [2, 1],
		chk: [1, 1],
		blk: [1, 1],
		diq: [1, 1],
	},
	D: {
		hgt: [1.5, 1],
		stre: [4, 1],
		spd: [1, 1],
		endu: [1, 1],
		pss: [1, 1],
		wst: [2, 1],
		sst: [4, 1],
		stk: [1, 1],
		oiq: [1, 1],
		chk: [4, 1],
		blk: [4, 1],
		diq: [4, 1],
	},
	G: {
		glk: [1, 1],
	},
};

// Handle some nonlinear interactions
const bonuses: Partial<Record<Position, (a: PlayerRatings) => number>> = {
	C: () => 5,
	W: () => 2,
	G: ratings => -0.2 * ratings.glk,
};

const ovr = (ratings: PlayerRatings, pos?: Position): number => {
	const pos2 = pos ?? ratings.pos;
	let r = 0;

	if (info.hasOwnProperty(pos2)) {
		let sumCoeffs = 0;

		// @ts-expect-error
		for (const [key, [coeff, power]] of Object.entries(info[pos2])) {
			const powerFactor = 100 / 100 ** power;
			// @ts-expect-error
			r += coeff * powerFactor * ratings[key] ** power;
			sumCoeffs += coeff;
		}

		r /= sumCoeffs;

		if (bonuses.hasOwnProperty(pos2)) {
			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-expect-error
			r += bonuses[pos2](ratings);
		}
	} else {
		throw new Error(`Unknown position: "${pos2}"`);
	}

	// Scale 10-90 to 0-100
	r = -10 + (r * 100) / 80;

	r = helpers.bound(Math.round(r), 0, 100);

	return r;
};

export default ovr;
