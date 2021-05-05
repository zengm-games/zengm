import genFuzz from "./genFuzz";
import limitRating from "./limitRating";
import { helpers, random } from "../../util";
//import posFootball from "./pos.football";
import { POSITION_COUNTS } from "../../../common/constants.football";
import type { PlayerRatings } from "../../../common/types.football";

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
	if (pos === "QB") {
		// Running QB
		if (Math.random() < 0.15) {
			return {
				hgt: 0.9,
				spd: 1.25,
				thv: 0.85,
				thp: 2,
				tha: 1.5,
				bsc: 1,
				elu: 1.25,
				hnd: 0.25,
				tck: -1,
				prs: -1,
				rns: -1,
			};
		}

		return {
			hgt: 1,
			spd: 0.5,
			thv: 1,
			thp: 2,
			tha: 2,
			bsc: 0.25,
			elu: 0.25,
			hnd: 0.25,
			tck: -1,
			prs: -1,
			rns: -1,
		};
	}

	if (pos === "RB") {
		return {
			stre: 0.25,
			spd: 1.3,
			bsc: 1,
			elu: 1,
			rtr: 0.5,
			hnd: 0.5,
			tck: -1,
			prs: -1,
			rns: -1,
		};
	}

	if (pos === "WR") {
		return {
			hgt: 1,
			spd: 1,
			elu: 0.5,
			rtr: 1,
			hnd: 1,
			rbk: -0.5,
			pbk: -0.5,
			tck: -1,
			prs: -1,
			rns: -1,
		};
	}

	if (pos === "TE") {
		return {
			hgt: 1,
			stre: 0.7,
			spd: 0.5,
			elu: -0.5,
			rtr: 0.8,
			hnd: 0.8,
			rbk: 0.7,
			pbk: 0.7,
			tck: -1,
			prs: -1,
			rns: -1,
		};
	}

	if (pos === "OL") {
		return {
			spd: -1.5,
			hgt: 1,
			stre: 1.25,
			rbk: 1.1,
			pbk: 1.1,
			elu: -1,
			bsc: -1,
			hnd: -1,
			tck: -1,
			prs: -1,
			rns: -1,
			rtr: -1,
		};
	}

	if (pos === "DL") {
		return {
			spd: -0.5,
			hgt: 1.5,
			stre: 1.25,
			tck: 0.25,
			prs: 1.1,
			rns: 1.1,
			elu: -1,
			bsc: -1,
			hnd: -1,
			rtr: -1,
			rbk: -1,
			pbk: -1,
		};
	}

	if (pos === "LB") {
		return {
			hgt: 0.5,
			stre: 0.5,
			spd: 0.25,
			pcv: 0.25,
			tck: 1,
			prs: 0.75,
			rns: 0.75,
			elu: -1,
			bsc: -1,
			hnd: -1,
			rtr: -0.75,
			rbk: -1,
			pbk: -1,
		};
	}

	if (pos === "CB") {
		return {
			hgt: -0.5,
			spd: 1.2,
			pcv: 1.2,
			tck: -0.5,
			hnd: -0.5,
			elu: -1,
			bsc: -1,
			rtr: -0.25,
			rbk: -1,
			pbk: -1,
			prs: -1,
			rns: -1,
		};
	}

	if (pos === "S") {
		return {
			hgt: -0.5,
			stre: 0.5,
			spd: 1,
			pcv: 0.75,
			tck: 0.75,
			prs: -0.5,
			hnd: -1,
			elu: -1,
			bsc: -1,
			rtr: -1,
			rbk: -1,
			pbk: -1,
		};
	}

	if (pos === "K") {
		return {
			kpw: 1.75,
			kac: 1.25,
			elu: -1,
			bsc: -1,
			hnd: -1,
			rtr: -1,
			tck: -1,
			prs: -1,
			rns: -1,
			rbk: -1,
			pbk: -1,
		};
	}

	if (pos === "P") {
		return {
			ppw: 1.75,
			pac: 1.25,
			elu: -1,
			bsc: -1,
			hnd: -1,
			rtr: -1,
			tck: -1,
			prs: -1,
			rns: -1,
			rbk: -1,
			pbk: -1,
		};
	}

	throw new Error(`Invalid position "${pos}"`);
};

// 5'4" to 6'10"
const heightToInches = (hgt: number) => {
	return Math.round(64 + (hgt * (82 - 64)) / 100);
};

/*const info: any = {};
const infoIn: any = {};
const infoOut: any = {};
let timeoutID: any;*/

const initialRating = () => limitRating(random.truncGauss(10, 10, 0, 40));

const defaultOvrsOrPots = {
	QB: 0,
	RB: 0,
	WR: 0,
	TE: 0,
	OL: 0,
	DL: 0,
	LB: 0,
	CB: 0,
	S: 0,
	K: 0,
	P: 0,
	KR: 0,
	PR: 0,
};

/**
 * Generate initial ratings for a newly-created
 *
 * @param {number} season [description]
 * @param {number} scoutingRank Between 1 and g.get("numActiveTeams") (default 30), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
 * @param {number} tid [description]
 * @return {Object} Ratings object
 */
const genRatings = (
	season: number,
	scoutingRank: number,
): {
	heightInInches: number;
	ratings: PlayerRatings;
} => {
	const pos = getPos();

	const rawRatings = {
		hgt: initialRating(),
		stre: initialRating(),
		spd: initialRating(),
		endu: initialRating(),
		thv: initialRating(),
		thp: initialRating(),
		tha: initialRating(),
		bsc: initialRating(),
		elu: initialRating(),
		rtr: initialRating(),
		hnd: initialRating(),
		rbk: initialRating(),
		pbk: initialRating(),
		pcv: initialRating(),
		tck: initialRating(),
		prs: initialRating(),
		rns: initialRating(),
		kpw: initialRating(),
		kac: initialRating(),
		ppw: initialRating(),
		pac: initialRating(),
	};

	const ratingsToBoost = getRatingsToBoost(pos);

	for (const rating of helpers.keys(ratingsToBoost)) {
		const factor = ratingsToBoost[rating];
		if (factor !== undefined) {
			rawRatings[rating] = limitRating(
				(rawRatings[rating] += factor * random.truncGauss(10, 20, 10, 30)),
			);
		}
	}

	if (pos !== "K" && pos !== "P" && Math.random() < 0.95) {
		rawRatings.kpw = random.randInt(0, 10);
		rawRatings.kac = random.randInt(0, 10);
		rawRatings.ppw = random.randInt(0, 10);
		rawRatings.pac = random.randInt(0, 10);
	}

	if (pos === "RB") {
		rawRatings.elu = helpers.bound(rawRatings.elu, 50, Infinity);
	}

	if (pos === "WR") {
		rawRatings.rtr = helpers.bound(rawRatings.rtr, 50, Infinity);
		rawRatings.hnd = helpers.bound(rawRatings.hnd, 50, Infinity);
	}

	if (pos === "TE") {
		rawRatings.stre = helpers.bound(rawRatings.stre, 40, Infinity);
		rawRatings.rbk = helpers.bound(rawRatings.rbk, 30, Infinity);
	}

	if (pos === "OL") {
		rawRatings.stre = helpers.bound(rawRatings.stre, 60, Infinity);
		rawRatings.rbk = helpers.bound(rawRatings.rbk, 40, Infinity);
		rawRatings.pbk = helpers.bound(rawRatings.pbk, 40, Infinity);
	}

	if (pos === "DL") {
		rawRatings.stre = helpers.bound(rawRatings.stre, 60, Infinity);
		rawRatings.prs = helpers.bound(rawRatings.prs, 40, Infinity);
		rawRatings.rns = helpers.bound(rawRatings.rns, 40, Infinity);
	}

	if (pos === "LB") {
		rawRatings.tck = helpers.bound(rawRatings.tck, 50, Infinity);
	}

	if (pos === "CB") {
		rawRatings.spd = helpers.bound(rawRatings.spd, 60, Infinity);
	}

	if (pos === "S") {
		rawRatings.spd = helpers.bound(rawRatings.spd, 50, Infinity);
	}

	for (const rating of ["hgt", "spd"] as const) {
		rawRatings[rating] = limitRating(
			rawRatings[rating] + random.truncGauss(20, 10, 0, 40),
		);
	}

	rawRatings.endu = limitRating(
		rawRatings.endu + random.truncGauss(12.5, 10, 0, 25),
	);
	rawRatings.bsc = limitRating(
		rawRatings.bsc + random.truncGauss(10, 10, 0, 20),
	);
	const ratings = {
		hgt: rawRatings.hgt,
		stre: rawRatings.stre,
		spd: rawRatings.spd,
		endu: rawRatings.endu,
		thv: rawRatings.thv,
		thp: rawRatings.thp,
		tha: rawRatings.tha,
		bsc: rawRatings.bsc,
		elu: rawRatings.elu,
		rtr: rawRatings.rtr,
		hnd: rawRatings.hnd,
		rbk: rawRatings.rbk,
		pbk: rawRatings.pbk,
		pcv: rawRatings.pcv,
		tck: rawRatings.tck,
		prs: rawRatings.prs,
		rns: rawRatings.rns,
		kpw: rawRatings.kpw,
		kac: rawRatings.kac,
		ppw: rawRatings.ppw,
		pac: rawRatings.pac,
		fuzz: genFuzz(scoutingRank),
		ovr: 0,
		pos,
		pot: 0,
		season,
		skills: [],
		ovrs: { ...defaultOvrsOrPots },
		pots: { ...defaultOvrsOrPots },
	};

	/*const pos2 = posFootball(ratings);
	info[`${pos}->${pos2}`] =
		info[`${pos}->${pos2}`] === undefined ? 1 : info[`${pos}->${pos2}`] + 1;
	infoIn[pos] = infoIn[pos] === undefined ? 1 : infoIn[pos] + 1;
	infoOut[pos2] = infoOut[pos2] === undefined ? 1 : infoOut[pos2] + 1;
	clearTimeout(timeoutID);
	timeoutID = setTimeout(() => {
		console.log(info);
		for (const pos2 of Object.keys(POSITION_COUNTS)) {
			if (infoIn.hasOwnProperty(pos2)) {
				console.log(pos2, infoIn[pos2], infoOut[pos2]);
			}
		}
	}, 1000);*/

	return {
		heightInInches: heightToInches(ratings.hgt),
		ratings,
	};
};

export default genRatings;
