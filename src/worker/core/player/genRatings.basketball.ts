import genFuzz from "./genFuzz";
import heightToRating from "./heightToRating";
import limitRating from "./limitRating";
import { helpers, random } from "../../util";
import type { PlayerRatings } from "../../../common/types.basketball";

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
			-0.04097378, 0.10708854, -0.37189642, -0.16707005, -0.31409436,
			-0.29164582, 0.33714843, 0.10838294, -0.31849462, -0.12487201, -0.3799997,
			0.12642711, -0.30714244, 0.03870837, -0.37182716,
		],
		[
			0.26861978, 0.3138044, 0.15214671, 0.24289334, 0.03620905, -0.02747153,
			0.19318229, 0.47557852, 0.06119868, 0.21228091, 0.20542903, 0.40515214,
			0.03863032, 0.4684178, -0.07482827,
		],
		[
			-0.18922555, 0.35164002, -0.30484948, 0.02890456, 0.30394453, 0.25071532,
			0.28024483, -0.00872483, 0.26769468, 0.02539012, -0.5109063, -0.14047495,
			0.2038116, 0.17138019, 0.29823953,
		],
	];

	const pca1 = 1.61 * hgt - 77.92 + random.realGauss(0, 18.0);
	const pca2 = 0.51 * hgt - 24.93 + random.realGauss(0, 20.0);
	const pca3 = 0.29 * hgt - 14.16 + random.realGauss(0, 10.0);

	const rawRatings = {
		diq:
			41.8 +
			pca1 * pca_comp[0][0] +
			pca2 * pca_comp[1][0] +
			pca3 * pca_comp[2][0],
		dnk:
			47.6 +
			pca1 * pca_comp[0][1] +
			pca2 * pca_comp[1][1] +
			pca3 * pca_comp[2][1],
		drb:
			49.5 +
			pca1 * pca_comp[0][2] +
			pca2 * pca_comp[1][2] +
			pca3 * pca_comp[2][2],
		endu:
			34.3 +
			pca1 * pca_comp[0][3] +
			pca2 * pca_comp[1][3] +
			pca3 * pca_comp[2][3],
		fg:
			43.1 +
			pca1 * pca_comp[0][4] +
			pca2 * pca_comp[1][4] +
			pca3 * pca_comp[2][4],
		ft:
			43.1 +
			pca1 * pca_comp[0][5] +
			pca2 * pca_comp[1][5] +
			pca3 * pca_comp[2][5],
		hgt: hgt,
		ins:
			41.5 +
			pca1 * pca_comp[0][7] +
			pca2 * pca_comp[1][7] +
			pca3 * pca_comp[2][7],
		jmp:
			51.6 +
			pca1 * pca_comp[0][8] +
			pca2 * pca_comp[1][8] +
			pca3 * pca_comp[2][8],
		oiq:
			40.7 +
			pca1 * pca_comp[0][9] +
			pca2 * pca_comp[1][9] +
			pca3 * pca_comp[2][9],
		pss:
			46.4 +
			pca1 * pca_comp[0][10] +
			pca2 * pca_comp[1][10] +
			pca3 * pca_comp[2][10],
		reb:
			48.7 +
			pca1 * pca_comp[0][11] +
			pca2 * pca_comp[1][11] +
			pca3 * pca_comp[2][11],
		spd:
			51.8 +
			pca1 * pca_comp[0][12] +
			pca2 * pca_comp[1][12] +
			pca3 * pca_comp[2][12],
		stre:
			47.6 +
			pca1 * pca_comp[0][13] +
			pca2 * pca_comp[1][13] +
			pca3 * pca_comp[2][13],
		tp:
			44.2 +
			pca1 * pca_comp[0][14] +
			pca2 * pca_comp[1][14] +
			pca3 * pca_comp[2][14],
	};

	for (const key of helpers.keys(rawRatings)) {
		rawRatings[key] = limitRating(rawRatings[key] * random.uniform(0.78, 1.2));
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
