import { helpers } from "../../../worker/util";
import type { PlayerRatings, Position } from "../../../common/types.baseball";
import { COMPOSITE_WEIGHTS } from "../../../common";
import compositeRating from "./compositeRating";

type RatingWeights = Record<string, [number, number]>;

export const infoDefense: Record<Position, RatingWeights> = {
	SP: {
		powerPitcher: [1, 1],
		finessePitcher: [2, 1],
		workhorsePitcher: [1, 1],
	},
	RP: {
		powerPitcher: [1, 1],
		finessePitcher: [2, 1],
	},
	C: {
		catcherDefense: [2, 1],
		arm: [1, 1],
	},
	"1B": {
		firstBaseDefense: [2, 1],
		infieldRange: [0.5, 1],
		groundBallDefense: [1, 1],
		arm: [0.5, 1],
	},
	"2B": {
		infieldRange: [1, 1],
		groundBallDefense: [2, 1],
		arm: [1, 1],
	},
	"3B": {
		infieldRange: [0.5, 1],
		groundBallDefense: [2, 1],
		arm: [2, 1],
	},
	SS: {
		infieldRange: [2, 1],
		groundBallDefense: [2, 1],
		arm: [2, 1],
	},
	LF: {
		outfieldRange: [2, 1],
		flyBallDefense: [2, 1],
		arm: [1, 1],
	},
	CF: {
		outfieldRange: [4, 1],
		flyBallDefense: [3, 1],
		arm: [1, 1],
	},
	RF: {
		outfieldRange: [2, 1],
		flyBallDefense: [2, 1],
		arm: [2, 1],
	},
	DH: {},
};

const infoOffense: RatingWeights = {
	powerHitter: [1, 1],
	contactHitter: [1, 1],
	eye: [1, 1],
	speed: [0.2, 1],
};

const getScore = (
	compositeRatings: Record<string, number>,
	info: RatingWeights,
) => {
	let r = 0;
	let sumCoeffs = 0;

	for (const [key, [coeff, power]] of Object.entries(info)) {
		const powerFactor = 100 / 100 ** power;
		r += coeff * powerFactor * compositeRatings[key] ** power;
		sumCoeffs += coeff;
	}

	r /= sumCoeffs;

	return r;
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

	const pos2 = pos ?? (ratings.pos as Position);
	const offense = getScore(compositeRatings, infoOffense);
	const defense = getScore(compositeRatings, infoDefense[pos2]);

	// The idea here is some positions are just easier to play (they have constants added to them) and are less important (they max out below 1). This is roughly based on WAR position adjustments.
	let r;
	if (pos2 === "RP") {
		r = 0.9 * defense;
	} else if (pos2 === "SP") {
		r = defense;
	} else if (pos2 === "DH") {
		r = 0.95 * offense;
	} else if (pos === "SS" || pos === "C") {
		r = 0.7 * offense + 0.3 * defense;
	} else if (pos === "CF" || pos === "3B" || pos === "2B") {
		r = 0.7 * offense + 0.05 + 0.2 * defense;
	} else {
		r = 0.7 * offense + 0.1 + 0.1 * defense;
	}

	r *= 100;

	if (pos2 === "RP" || pos2 === "SP") {
		// Scale 10-90 to 0-100
		r = -10 + (r * 100) / 80;
	} else {
		// Scale more for position players
		r = -20 + (r * 100) / 60;
	}

	r = helpers.bound(Math.round(r), 0, 100);

	return r;
};

export default ovr;
