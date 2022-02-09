import { helpers } from "../../../worker/util";
import type { PlayerRatings, Position } from "../../../common/types.football";
import { COMPOSITE_WEIGHTS } from "../../../common/constants.football";
import compositeRating from "./compositeRating";

const info = {
	QB: {
		passingAccuracy: [3, 1],
		passingDeep: [3, 1],
		passingVision: [3, 1],
		athleticism: [1, 1],
		rushing: [1, 1],
		avoidingSacks: [1, 1],
		ballSecurity: [1, 1],
		constant0: [-1.25, 1],
	},
	RB: {
		rushing: [10, 1],
		catching: [2, 1],
		gettingOpen: [1, 1],
		passBlocking: [1, 1],
		runBlocking: [1, 1],
		ballSecurity: [1, 1],
		constant0: [-1.25, 1],
	},
	WR: {
		catching: [5, 1],
		gettingOpen: [5, 1],
		rushing: [1, 1],
		ballSecurity: [1, 1],
		constant0: [1.25, 1],
	},
	TE: {
		catching: [2, 1],
		gettingOpen: [2, 1],
		passBlocking: [2, 1],
		runBlocking: [2, 1],
		constant0: [-0.525, 1],
	},
	OL: {
		passBlocking: [3, 1],
		runBlocking: [3, 1],
		constant0: [0.75, 1],
	},
	DL: {
		passRushing: [5, 1],
		runStopping: [5, 1],
		tackling: [1, 1],
		constant0: [0.25, 1],
	},
	LB: {
		passRushing: [2, 1],
		runStopping: [2, 1],
		passCoverage: [1, 1],
		tackling: [4, 1],
		constant0: [-0.75, 1],
	},
	CB: {
		passCoverage: [4.2, 1],
		constant0: [1, 1],
	},
	S: {
		passCoverage: [2, 1],
		tackling: [1, 1],
		constant0: [0.1, 1],
	},
	K: {
		kickingPower: [1, 1],
		kickingAccuracy: [1, 1],
	},
	P: {
		punting: [1, 1],
	},
	KR: {
		rushing: [2, 1],
		ballSecurity: [1, 1],
	},
	PR: {
		rushing: [1, 1],
		ballSecurity: [1, 1],
	},
};

const ovr = (ratings: PlayerRatings, pos?: Position): number => {
	const compositeRatings: Record<string, number> = {
		constant0: 0,
	};

	for (const k of Object.keys(COMPOSITE_WEIGHTS)) {
		compositeRatings[k] = compositeRating(
			ratings,
			COMPOSITE_WEIGHTS[k].ratings,
			COMPOSITE_WEIGHTS[k].weights,
			false,
		);
	}

	const pos2 = pos ?? ratings.pos;
	let r = 0;

	if (info.hasOwnProperty(pos2)) {
		let sumCoeffs = 0;

		// @ts-expect-error
		for (const [key, [coeff, power]] of Object.entries(info[pos2])) {
			const powerFactor = 100 / 100 ** power;
			r += coeff * powerFactor * compositeRatings[key] ** power;
			sumCoeffs += coeff;
		}

		r /= sumCoeffs;
	} else {
		throw new Error(`Unknown position: "${pos2}"`);
	}

	r *= 100;

	// Fudge factor to keep ovr ratings the same as they used to be (back before 2021 ratings rescaling)
	// +15 at 68
	// +5 at 62
	// +0 at 59
	// -5 at 52
	// -15 at 40
	let fudgeFactor = 0;
	if (r >= 68) {
		fudgeFactor = 15;
	} else if (r >= 62) {
		fudgeFactor = 5 + (r - 62) * (10 / 6);
	} else if (r >= 59) {
		fudgeFactor = (r - 59) * (5 / 3);
	} else if (r >= 52) {
		fudgeFactor = -5 + (r - 52) * (5 / 7);
	} else if (r >= 40) {
		fudgeFactor = -15 + (r - 40) * (10 / 12);
	} else {
		fudgeFactor = -15;
	}

	r = helpers.bound(Math.round(r + fudgeFactor), 0, 100);

	// Feels silly that the highest rated players are kickers and punters
	if (pos === "K" || pos === "P") {
		r = Math.round(r * 0.75);
	}

	// QB should never be KR/PR
	if (ratings.pos === "QB" && (pos === "KR" || pos === "PR")) {
		r = Math.round(r * 0.5);
	}

	return r;
};

export default ovr;
