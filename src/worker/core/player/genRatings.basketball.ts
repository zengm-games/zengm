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
			0.01143473, 0.18681705, -0.302455, -0.11453141, -0.3093686, -0.3117734,
			0.39198348, 0.17170778, -0.33111817, -0.06919178, -0.31790763, 0.1837728,
			-0.29564103, 0.12445679, -0.3635497,
		],
		[
			0.26099068, 0.32022768, 0.22354284, 0.27015418, 0.08270443, 0.06164626,
			0.00622841, 0.517066, 0.07112398, 0.2629814, 0.2984516, 0.3287413,
			0.06890596, 0.3749461, -0.10794741,
		],
		[
			-0.15255773, 0.38756528, -0.26229388, 0.05008439, 0.28697568, 0.2588261,
			0.33136192, 0.01230466, 0.25432152, 0.04441171, -0.4698831, -0.15000868,
			0.22909337, 0.23237176, 0.28194028,
		],
	];

	const pca1 = 1.72 * hgt - 83.44 + random.realGauss(0, 0.23) - 0.513;
	const pca2 = 0.01 * hgt - 0.47 + random.realGauss(0, 23.1) - 14.78;
	const pca3 = 0.34 * hgt - 16.39 + random.realGauss(0, 0.975) + 2.4;

	const rawRatings = {
		diq:
			42.1 +
			pca1 * pca_comp[0][0] +
			pca2 * pca_comp[1][0] +
			pca3 * pca_comp[2][0],
		dnk:
			46.5 +
			pca1 * pca_comp[0][1] +
			pca2 * pca_comp[1][1] +
			pca3 * pca_comp[2][1],
		drb:
			50.5 +
			pca1 * pca_comp[0][2] +
			pca2 * pca_comp[1][2] +
			pca3 * pca_comp[2][2],
		endu:
			32.5 +
			pca1 * pca_comp[0][3] +
			pca2 * pca_comp[1][3] +
			pca3 * pca_comp[2][3],
		fg:
			42.5 +
			pca1 * pca_comp[0][4] +
			pca2 * pca_comp[1][4] +
			pca3 * pca_comp[2][4],
		ft:
			42.5 +
			pca1 * pca_comp[0][5] +
			pca2 * pca_comp[1][5] +
			pca3 * pca_comp[2][5],
		hgt: hgt,
		ins:
			41.1 +
			pca1 * pca_comp[0][7] +
			pca2 * pca_comp[1][7] +
			pca3 * pca_comp[2][7],
		jmp:
			51.0 +
			pca1 * pca_comp[0][8] +
			pca2 * pca_comp[1][8] +
			pca3 * pca_comp[2][8],
		oiq:
			40.1 +
			pca1 * pca_comp[0][9] +
			pca2 * pca_comp[1][9] +
			pca3 * pca_comp[2][9],
		pss:
			47.3 +
			pca1 * pca_comp[0][10] +
			pca2 * pca_comp[1][10] +
			pca3 * pca_comp[2][10],
		reb:
			48.7 +
			pca1 * pca_comp[0][11] +
			pca2 * pca_comp[1][11] +
			pca3 * pca_comp[2][11],
		spd:
			51.4 +
			pca1 * pca_comp[0][12] +
			pca2 * pca_comp[1][12] +
			pca3 * pca_comp[2][12],
		stre:
			47.6 +
			pca1 * pca_comp[0][13] +
			pca2 * pca_comp[1][13] +
			pca3 * pca_comp[2][13],
		tp:
			44.9 +
			pca1 * pca_comp[0][14] +
			pca2 * pca_comp[1][14] +
			pca3 * pca_comp[2][14],
	};

	for (const key of helpers.keys(rawRatings)) {
		rawRatings[key] = limitRating(rawRatings[key] * random.uniform(0.86, 1.19));
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
