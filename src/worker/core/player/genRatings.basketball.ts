import genFuzz from "./genFuzz";
import heightToRating from "./heightToRating";
import limitRating from "./limitRating";
import { helpers, random } from "../../util";
import type {
	PlayerRatings,
	RatingKey,
} from "../../../common/types.basketball";

const typeFactors: Record<
	"point" | "wing" | "big",
	Partial<Record<RatingKey, number>>
> = {
	point: {
		jmp: 1.65,
		spd: 1.65,
		drb: 1.5,
		pss: 1.5,
		ft: 1.4,
		fg: 1.4,
		tp: 1.4,
		oiq: 1.2,
		endu: 1.4,
	},
	wing: {
		drb: 1.2,
		dnk: 1.5,
		jmp: 1.4,
		spd: 1.4,
		ft: 1.2,
		fg: 1.2,
		tp: 1.2,
	},
	big: {
		stre: 1.2,
		ins: 1.6,
		dnk: 1.5,
		reb: 1.4,
		ft: 0.8,
		fg: 0.8,
		tp: 0.8,
		diq: 1.2,
	},
};

/**
 * Generate initial ratings for a newly-created player.
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
	// realHeight is drawn from a custom probability distribution and then offset by a fraction of an inch either way
	let heightInInches = random.heightDist() + Math.random() - 0.5; // Fraction of an inch

	const wingspanAdjust = heightInInches + random.randInt(-1, 1); // hgt 0-100 corresponds to height 5'6" to 7'9" (Anything taller or shorter than the extremes will just get 100/0)

	const hgt = heightToRating(wingspanAdjust);
	heightInInches = Math.round(heightInInches); // Pick type of player (point, wing, or big) based on height

	const pca_comp = [
		[
			-0.03352406, 0.12346389, -0.35794756, -0.15434998, -0.3113007, -0.2962055,
			0.34777623, 0.12785922, -0.3111465, -0.11403359, -0.36446682, 0.13955043,
			-0.30497047, 0.06144027, -0.38837135,
		],
		[
			0.28366816, 0.30712998, 0.17298037, 0.23822004, 0.03453123, -0.02717308,
			0.16869372, 0.47707278, 0.09103202, 0.21353549, 0.23247957, 0.39476818,
			0.05918039, 0.45708638, -0.06589692,
		],
		[
			-0.17455344, 0.3758997, -0.30602956, 0.0244445, 0.30912668, 0.26491034,
			0.26718402, 0.00262062, 0.2510174, 0.03160773, -0.51004165, -0.13338444,
			0.1938457, 0.17691812, 0.29330686,
		],
	];

	const pca1 = 1.64 * hgt - 79.1 + random.realGauss(0, 14.3);
	const pca2 = 0.42 * hgt - 20.12 + random.realGauss(0, 16.2);
	const pca3 = 0.29 * hgt - 13.78 + random.realGauss(0, 9.2);

	const rawRatings = {
		diq:
			41.5 +
			pca1 * pca_comp[0][0] +
			pca2 * pca_comp[1][0] +
			pca3 * pca_comp[2][0],
		dnk:
			46.8 +
			pca1 * pca_comp[0][1] +
			pca2 * pca_comp[1][1] +
			pca3 * pca_comp[2][1],
		drb:
			59.2 +
			pca1 * pca_comp[0][2] +
			pca2 * pca_comp[1][2] +
			pca3 * pca_comp[2][2],
		endu:
			35.3 +
			pca1 * pca_comp[0][3] +
			pca2 * pca_comp[1][3] +
			pca3 * pca_comp[2][3],
		fg:
			42.9 +
			pca1 * pca_comp[0][4] +
			pca2 * pca_comp[1][4] +
			pca3 * pca_comp[2][4],
		ft:
			43.0 +
			pca1 * pca_comp[0][5] +
			pca2 * pca_comp[1][5] +
			pca3 * pca_comp[2][5],
		hgt:
			48.1 +
			pca1 * pca_comp[0][6] +
			pca2 * pca_comp[1][6] +
			pca3 * pca_comp[2][6],
		ins:
			40.8 +
			pca1 * pca_comp[0][7] +
			pca2 * pca_comp[1][7] +
			pca3 * pca_comp[2][7],
		jmp:
			50.7 +
			pca1 * pca_comp[0][8] +
			pca2 * pca_comp[1][8] +
			pca3 * pca_comp[2][8],
		oiq:
			40.8 +
			pca1 * pca_comp[0][9] +
			pca2 * pca_comp[1][9] +
			pca3 * pca_comp[2][9],
		pss:
			46.1 +
			pca1 * pca_comp[0][10] +
			pca2 * pca_comp[1][10] +
			pca3 * pca_comp[2][10],
		reb:
			48.3 +
			pca1 * pca_comp[0][11] +
			pca2 * pca_comp[1][11] +
			pca3 * pca_comp[2][11],
		spd:
			51.2 +
			pca1 * pca_comp[0][12] +
			pca2 * pca_comp[1][12] +
			pca3 * pca_comp[2][12],
		stre:
			46.9 +
			pca1 * pca_comp[0][13] +
			pca2 * pca_comp[1][13] +
			pca3 * pca_comp[2][13],
		tp:
			44.3 +
			pca1 * pca_comp[0][14] +
			pca2 * pca_comp[1][14] +
			pca3 * pca_comp[2][14],
	};

	for (const key of helpers.keys(rawRatings)) {
		rawRatings[key] = limitRating(rawRatings[key] * random.uniform(0.5, 1.2));
	}

	const ratings = {
		stre: rawRatings.stre,
		spd: rawRatings.spd,
		jmp: rawRatings.jmp,
		endu: rawRatings.endu,
		ins: rawRatings.ins,
		dnk: rawRatings.dnk,
		ft: rawRatings.ft,
		fg: rawRatings.fg,
		tp: rawRatings.tp,
		oiq: rawRatings.oiq,
		diq: rawRatings.diq,
		drb: rawRatings.drb,
		pss: rawRatings.pss,
		reb: rawRatings.reb,
		hgt,
		fuzz: genFuzz(scoutingRank),
		ovr: 0,
		pos: "F",
		pot: 0,
		season,
		skills: [],
	};

	return {
		heightInInches,
		ratings,
	};
};

export default genRatings;
