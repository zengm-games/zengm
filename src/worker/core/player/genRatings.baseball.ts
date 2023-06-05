import genFuzz from "./genFuzz";
import limitRating from "./limitRating";
import { helpers, random } from "../../util";
import { POSITION_COUNTS } from "../../../common/constants.baseball";
import type { PlayerRatings } from "../../../common/types.baseball";

const getPos = () => {
	const numPlayers = Object.values(POSITION_COUNTS).reduce((sum, val) => {
		return sum + val;
	}, 0);
	const rand = Math.random() * numPlayers;
	let cumsum = 0;

	for (const [pos, count] of Object.entries(POSITION_COUNTS)) {
		cumsum += count;

		if (rand < cumsum) {
			return pos;
		}
	}

	throw new Error("No position found - this should never happen!");
};

const getRatingsToBoost = (pos: string) => {
	const nonPitcher = {
		ppw: 0.25,
		ctl: 0.25,
		mov: 0.25,
		endu: 0.25,
	};

	if (pos === "SP") {
		return {
			hgt: 1.5,
			spd: 0.5,
			ppw: 1.75,
			ctl: 1.25,
			mov: 1.5,
			cat: 0.25,
			endu: 2,
			hpw: 0.25,
			con: 0.25,
			eye: 0.25,
		};
	}
	if (pos === "RP") {
		return {
			hgt: 1.5,
			spd: 0.5,
			ppw: 2,
			ctl: 1,
			mov: 1,
			cat: 0.25,
			hpw: 0.25,
			con: 0.25,
			eye: 0.25,
		};
	}
	if (pos === "C") {
		return {
			...nonPitcher,
			spd: 0.5,
			cat: 1.75,
		};
	}
	if (pos === "1B") {
		return {
			...nonPitcher,
			hgt: 1.5,
			spd: 0.75,
			gnd: 1.25,
			fly: 1.5,
			cat: 0.25,
			hpw: 1.25,
		};
	}
	if (pos === "2B") {
		return {
			...nonPitcher,
			hgt: 0.75,
			spd: 1.25,
			gnd: 1.5,
			fly: 1.25,
			thr: 1.25,
			cat: 0.25,
		};
	}
	if (pos === "3B") {
		return {
			...nonPitcher,
			spd: 0.75,
			gnd: 1.5,
			fly: 1.25,
			thr: 2,
			cat: 0.25,
		};
	}
	if (pos === "SS") {
		return {
			...nonPitcher,
			spd: 1.5,
			gnd: 1.75,
			fly: 1.5,
			thr: 1.5,
			cat: 0.25,
		};
	}
	if (pos === "LF") {
		return {
			...nonPitcher,
			gnd: 1.5,
			fly: 1.5,
			thr: 1.5,
			cat: 0.25,
			hpw: 1.25,
		};
	}
	if (pos === "CF") {
		return {
			...nonPitcher,
			spd: 2,
			gnd: 1.5,
			fly: 1.75,
			thr: 1.5,
			cat: 0.25,
		};
	}
	if (pos === "RF") {
		return {
			...nonPitcher,
			gnd: 1.5,
			fly: 1.5,
			thr: 2,
			cat: 0.25,
			hpw: 1.5,
		};
	}

	throw new Error(`Invalid position "${pos}"`);
};

// 5'4" to 6'10"
const heightToInches = (hgt: number) => {
	return Math.round(64 + (hgt * (82 - 64)) / 100);
};

/*const info = {};
const infoIn = {};
const infoOut = {};
let timeoutID;*/

const initialRating = () => limitRating(random.truncGauss(7, 3, 0, 15));

const defaultOvrsOrPots = {
	SP: 0,
	RP: 0,
	C: 0,
	"1B": 0,
	"2B": 0,
	"3B": 0,
	SS: 0,
	LF: 0,
	CF: 0,
	RF: 0,
	DH: 0,
};

const genRatings = (
	season: number,
	scoutingLevel: number,
): {
	heightInInches: number;
	ratings: PlayerRatings;
} => {
	const pos = getPos();

	const isPitcher = pos === "RP" || pos === "SP";

	const rawRatings = {
		hgt: initialRating() + 30,
		spd: initialRating() * (isPitcher ? 1 : 3),
		hpw: initialRating() * (isPitcher ? 1 : 3.25),
		con: initialRating() * (isPitcher ? 1 : 3),
		eye: initialRating() * (isPitcher ? 1 : 3),
		gnd: initialRating(),
		fly: initialRating(),
		thr: initialRating() * (isPitcher ? 1 : 1.25),
		cat: initialRating(),
		ppw: initialRating(),
		ctl: initialRating(),
		mov: initialRating(),
		endu: initialRating(),
	};

	const ratingsToBoost = getRatingsToBoost(pos);

	for (const rating of helpers.keys(ratingsToBoost)) {
		const factor = ratingsToBoost[rating];
		if (factor !== undefined) {
			rawRatings[rating] = limitRating(
				(rawRatings[rating] += factor * random.truncGauss(10, 15, 8, 30)),
			);
		}
	}

	const ratings = {
		...rawRatings,
		fuzz: genFuzz(scoutingLevel),
		ovr: 0,
		pos,
		pot: 0,
		season,
		skills: [],
		ovrs: { ...defaultOvrsOrPots },
		pots: { ...defaultOvrsOrPots },
	};

	return {
		heightInInches: heightToInches(ratings.hgt),
		ratings,
	};
};

export default genRatings;
