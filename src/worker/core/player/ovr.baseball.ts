import { helpers } from "../../../worker/util";
import type {
	PlayerRatings,
	Position,
	RatingKey,
} from "../../../common/types.baseball";

type RatingWeights = Partial<Record<RatingKey, [number, number]>>;

const infoDefense: Record<Position, RatingWeights> = {
	SP: {
		ppw: [1, 1],
		ctl: [1, 1],
		mov: [1, 1],
		endu: [2, 1],
	},
	RP: {
		ppw: [1, 1],
		ctl: [1, 1],
		mov: [1, 1],
		endu: [-1, 1],
	},
	C: {
		cat: [2, 1],
		thr: [1, 1],
	},
	"1B": {
		hgt: [2, 1],
		spd: [0.5, 1],
		gnd: [1, 1],
		thr: [0.5, 1],
	},
	"2B": {
		hgt: [1, 1],
		spd: [1, 1],
		gnd: [2, 1],
		thr: [1, 1],
	},
	"3B": {
		hgt: [1, 1],
		spd: [0.5, 1],
		gnd: [2, 1],
		thr: [2, 1],
	},
	SS: {
		hgt: [1, 1],
		spd: [2, 1],
		gnd: [2, 1],
		thr: [2, 1],
	},
	LF: {
		hgt: [1, 1],
		spd: [2, 1],
		fly: [2, 1],
		thr: [1, 1],
	},
	CF: {
		hgt: [1, 1],
		spd: [4, 1],
		fly: [3, 1],
		thr: [1, 1],
	},
	RF: {
		hgt: [1, 1],
		spd: [2, 1],
		fly: [2, 1],
		thr: [2, 1],
	},
};

const infoOffense: RatingWeights = {
	hpw: [1, 1],
	con: [1, 1],
	eye: [1, 1],
};

const getScore = (ratings: PlayerRatings, info: RatingWeights) => {
	let r = 0;
	let sumCoeffs = 0;

	for (const [key, [coeff, power]] of Object.entries(info)) {
		const powerFactor = 100 / 100 ** power;
		r += coeff * powerFactor * (ratings as any)[key] ** power;
		sumCoeffs += coeff;
	}

	r /= sumCoeffs;

	return r;
};

const ovr = (ratings: PlayerRatings, pos?: Position): number => {
	const pos2 = pos ?? (ratings.pos as Position);
	const offense = getScore(ratings, infoOffense);
	const defense = getScore(ratings, infoDefense[pos2]);

	let r;
	if (pos2 === "RP" || pos2 === "SP") {
		r = 0.1 * offense + 0.9 * defense;
	} else {
		r = 0.6 * offense + 0.4 * defense;
	}

	// Scale 10-90 to 0-100
	r = -10 + (r * 100) / 80;

	r = helpers.bound(Math.round(r), 0, 100);

	return r;
};

export default ovr;
