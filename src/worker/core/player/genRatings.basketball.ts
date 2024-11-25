import genFuzz from "./genFuzz";
import heightToRating from "./heightToRating";
import limitRating from "./limitRating";
import { helpers, random } from "../../util";
import type { PlayerRatings } from "../../../common/types.basketball";

const ratingCategoryKeys = {
	physical: ["spd", "jmp", "endu"] as const,
	point: ["drb", "pss", "oiq"] as const,
	shooting: ["ft", "fg", "tp"] as const,
	inside: ["dnk", "ins"] as const,
	defense: ["diq", "reb"] as const,
	strength: ["stre"] as const,
};
const ratingCategories = helpers.keys(ratingCategoryKeys);

const getBuffAmount = (
	category: (typeof ratingCategories)[number],
	hgt: number,
): -1 | 1 => {
	if (category === "inside" || category === "defense") {
		return Math.random() < 0.5 ? 1 : -1;
	}

	// Number (0.25, 0.75) representing height. 0.1 is 6'3" (33) and 0.9 is 6'10" (59). Anything beyond that is truncated
	const hgtFraction = helpers.bound(
		0.25 + (0.5 * (hgt - 33)) / (59 - 33),
		0.25,
		0.75,
	);

	if (category === "strength") {
		const r = Math.random();
		if (r < hgtFraction) {
			// Likely for tall players
			return 1;
		}

		// Likely for short players
		return -1;
	}

	const r = Math.random();
	if (r > hgtFraction) {
		// Likely for short players
		return 1;
	}

	// Likely for tall players
	return -1;
};

const genRatings = (
	season: number,
	scoutingLevel: number,
): {
	heightInInches: number;
	ratings: PlayerRatings;
} => {
	// realHeight is drawn from a custom probability distribution and then offset by a fraction of an inch either way
	let heightInInches = random.heightDist() + Math.random() - 0.5; // Fraction of an inch

	const wingspanAdjust = heightInInches + random.randInt(-1, 1);

	// hgt 0-100 corresponds to height 5'6" to 7'9" (Anything taller or shorter than the extremes will just get 100/0)
	const hgt = heightToRating(wingspanAdjust);
	heightInInches = Math.round(heightInInches); // Pick type of player (point, wing, or big) based on height

	const rawRatings = {
		stre: 0,
		spd: 0,
		jmp: 0,
		endu: 0,
		ins: 0,
		dnk: 0,
		ft: 0,
		fg: 0,
		tp: 0,
		oiq: 0,
		diq: 0,
		drb: 0,
		pss: 0,
		reb: 0,
	};

	for (const key of helpers.keys(rawRatings)) {
		rawRatings[key] = random.randInt(0, 20);
	}

	for (const category of ratingCategories) {
		const amount = getBuffAmount(category, hgt);
		for (const key of ratingCategoryKeys[category]) {
			rawRatings[key] = limitRating(
				rawRatings[key] + amount + random.randInt(0, 25),
			);
		}
	}

	const ratings = {
		...rawRatings,
		hgt,
		fuzz: genFuzz(scoutingLevel),
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
