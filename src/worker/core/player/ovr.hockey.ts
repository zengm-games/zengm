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
		chk: [1, 1],
		blk: [1, 1],
		fcf: [4, 1],
		diq: [1, 1],
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
		chk: [2, 1],
		blk: [2, 1],
		diq: [2, 1],
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
	/*RB: ratings => helpers.bound((ratings.spd * ratings.elu) / 300, 6, 20),
	WR: ratings => helpers.bound((ratings.spd * ratings.hnd) / 550, 0, 5),
	TE: ratings => helpers.bound((ratings.stre * ratings.hnd) / 550, 2, 10),
	LB: ratings => helpers.bound(ratings.tck / 30, 2, 5),
	S: ratings => helpers.bound(((ratings.stre + 25) * ratings.pcv) / 550, 2, 15),*/
};

const ovr = (ratings: PlayerRatings, pos?: Position): number => {
	const pos2 = pos ?? ratings.pos;
	let r = 0;

	if (info.hasOwnProperty(pos2)) {
		let sumCoeffs = 0;

		// @ts-ignore
		for (const [key, [coeff, power]] of Object.entries(info[pos2])) {
			const powerFactor = 100 / 100 ** power;
			// @ts-ignore
			r += coeff * powerFactor * ratings[key] ** power;
			sumCoeffs += coeff;
		}

		r /= sumCoeffs;

		if (bonuses.hasOwnProperty(pos2)) {
			// https://github.com/microsoft/TypeScript/issues/21732
			// @ts-ignore
			r += bonuses[pos2](ratings);
		}
	} else {
		throw new Error(`Unknown position: "${pos2}"`);
	}

	// Fudge factor to keep ovr ratings the same as they used to be (back before 2018 ratings rescaling)
	// +8 at 68
	// +4 at 50
	// -5 at 42
	// -10 at 31
	let fudgeFactor = 0;

	if (r >= 68) {
		fudgeFactor = 8;
	} else if (r >= 50) {
		fudgeFactor = 4 + (r - 50) * (4 / 18);
	} else if (r >= 42) {
		fudgeFactor = -5 + (r - 42) * (10 / 8);
	} else if (r >= 31) {
		fudgeFactor = -5 - (42 - r) * (5 / 11);
	} else {
		fudgeFactor = -10;
	}

	r = helpers.bound(Math.round(r + fudgeFactor), 0, 100);

	return r;
};

export default ovr;
