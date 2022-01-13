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
			-0.03143667, 0.13151142, -0.35923427, -0.14588372, -0.30707702,
			-0.2923038, 0.35577568, 0.13378376, -0.30905554, -0.11226255, -0.36662078,
			0.14404827, -0.3010302, 0.06513013, -0.38604742,
		],
		[
			0.28741613, 0.2948169, 0.18162839, 0.22216108, 0.04010548, -0.02320695,
			0.16749835, 0.4756356, 0.08802667, 0.21357235, 0.24305432, 0.40340626,
			0.05871636, 0.45862335, -0.05236033,
		],
		[
			0.17881319, -0.36455768, 0.29882076, -0.03616037, -0.3152401, -0.26787323,
			-0.27231044, -0.01128095, -0.2439317, -0.03754768, 0.50334144, 0.13699001,
			-0.19139023, -0.1869137, -0.30742782,
		],
	];

	const pca1 = 1.62 * hgt - 78.12 + random.realGauss(0, 13.3);
	const pca2 = 0.4 * hgt - 19.41 + random.realGauss(0, 14.9);
	const pca3 = -0.28 * hgt + 13.35 + random.realGauss(0, 9.0);

	const rawRatings = {
		diq:
			41.2 +
			pca1 * pca_comp[0][0] +
			pca2 * pca_comp[1][0] +
			pca3 * pca_comp[2][0],
		dnk:
			46.6 +
			pca1 * pca_comp[0][1] +
			pca2 * pca_comp[1][1] +
			pca3 * pca_comp[2][1],
		drb:
			49.1 +
			pca1 * pca_comp[0][2] +
			pca2 * pca_comp[1][2] +
			pca3 * pca_comp[2][2],
		endu:
			32.1 +
			pca1 * pca_comp[0][3] +
			pca2 * pca_comp[1][3] +
			pca3 * pca_comp[2][3],
		fg:
			42.3 +
			pca1 * pca_comp[0][4] +
			pca2 * pca_comp[1][4] +
			pca3 * pca_comp[2][4],
		ft:
			42.4 +
			pca1 * pca_comp[0][5] +
			pca2 * pca_comp[1][5] +
			pca3 * pca_comp[2][5],
		hgt: hgt,
		ins:
			40.6 +
			pca1 * pca_comp[0][7] +
			pca2 * pca_comp[1][7] +
			pca3 * pca_comp[2][7],
		jmp:
			50.1 +
			pca1 * pca_comp[0][8] +
			pca2 * pca_comp[1][8] +
			pca3 * pca_comp[2][8],
		oiq:
			39.7 +
			pca1 * pca_comp[0][9] +
			pca2 * pca_comp[1][9] +
			pca3 * pca_comp[2][9],
		pss:
			45.8 +
			pca1 * pca_comp[0][10] +
			pca2 * pca_comp[1][10] +
			pca3 * pca_comp[2][10],
		reb:
			48.0 +
			pca1 * pca_comp[0][11] +
			pca2 * pca_comp[1][11] +
			pca3 * pca_comp[2][11],
		spd:
			50.7 +
			pca1 * pca_comp[0][12] +
			pca2 * pca_comp[1][12] +
			pca3 * pca_comp[2][12],
		stre:
			46.3 +
			pca1 * pca_comp[0][13] +
			pca2 * pca_comp[1][13] +
			pca3 * pca_comp[2][13],
		tp:
			44.0 +
			pca1 * pca_comp[0][14] +
			pca2 * pca_comp[1][14] +
			pca3 * pca_comp[2][14],
	};

	for (const key of helpers.keys(rawRatings)) {
		rawRatings[key] = limitRating(rawRatings[key] * random.uniform(0.8, 1.2));
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
