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
			0.01144491, 0.18678923, -0.30245945, -0.11454368, -0.30940279,
			-0.31179763, 0.39192477, 0.17167505, -0.33114137, -0.06918906,
			-0.31791678, 0.18375956, -0.29565832, 0.12444836, -0.36355192,
		],
		[
			0.26091959, 0.32038081, 0.22341533, 0.27030209, 0.08278275, 0.06169217,
			0.00644845, 0.5170028, 0.07126779, 0.26298184, 0.29825086, 0.32866972,
			0.06902588, 0.37508656, -0.1078734,
		],
		[
			-0.1527201, 0.38744556, -0.26238251, 0.04986639, 0.28690744, 0.25874772,
			0.33139227, 0.01208661, 0.25434695, 0.0442386, -0.46999709, -0.15012807,
			0.22910478, 0.23225618, 0.2819238,
		],
	];

	const pca1 = 1.72 * hgt - 83.45 + random.realGauss(0, 0.015) - 0.8;
	const pca2 = 0.01 * hgt - 0.48 + random.realGauss(0, 22.3) - 11.1;
	const pca3 = 0.34 * hgt - 16.39 + random.realGauss(0, 0.19) + 1.8;

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
			32.6 +
			pca1 * pca_comp[0][3] +
			pca2 * pca_comp[1][3] +
			pca3 * pca_comp[2][3],
		fg:
			42.5 +
			pca1 * pca_comp[0][4] +
			pca2 * pca_comp[1][4] +
			pca3 * pca_comp[2][4],
		ft:
			42.6 +
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
			40.2 +
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
		rawRatings[key] = limitRating(rawRatings[key] * random.uniform(0.81, 1.22));
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
