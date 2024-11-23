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
		ins: 2,
		dnk: 2,
		reb: 1.4,
		ft: 0.8,
		fg: 0.8,
		tp: 0.8,
		diq: 1.3,
	},
};

const ratingCategoryKeys = {
	physical: ["spd", "jmp", "endu"] as const,
	point: ["drb", "pss", "oiq"] as const,
	shooting: ["ft", "fg", "tp"] as const,
	inside: ["dnk", "ins"] as const,
	defense: ["diq", "reb"] as const,
	strength: ["stre"] as const,
};
const ratingCategories = helpers.keys(ratingCategoryKeys);

const getBuffDirection = (
	category: (typeof ratingCategories)[number],
	hgt: number,
): -1 | 1 => {
	if (category === "inside" || category === "defense") {
		return Math.random() < 0.5 ? 1 : -1;
	}

	// Number (0.1, 0.9) representing height. 0.1 is 6'3" (33) and 0.9 is 6'10" (59). Anything beyond that is truncated
	const hgtFraction = helpers.bound(
		0.1 + (0.8 * (hgt - 33)) / (59 - 33),
		0.1,
		0.9,
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
		stre: 40,
		spd: 50,
		jmp: 50,
		endu: 40,
		ins: 50,
		dnk: 50,
		ft: 50,
		fg: 50,
		tp: 50,
		oiq: 30,
		diq: 30,
		drb: 50,
		pss: 50,
		reb: 50,
	};

	for (const category of ratingCategories) {
		const sign = getBuffDirection(category, hgt);
		const amount = random.randInt(0, 15);
		for (const key of ratingCategoryKeys[category]) {
			rawRatings[key] = limitRating(
				rawRatings[key] + sign * (amount + random.randInt(0, 25)),
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
