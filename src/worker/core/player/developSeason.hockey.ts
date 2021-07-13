import limitRating from "./limitRating";
import { g, helpers, random } from "../../util";
import type { PlayerRatings, RatingKey } from "../../../common/types.hockey";

type RatingFormula = {
	ageModifier: (age: number) => number;
	changeLimits: (age: number) => [number, number];
	posCoeff: (pos: string) => number;
};

const noGoalieDecorator = (
	func: (pos: string) => number,
): ((pos: string) => number) => {
	return (pos: string) => {
		if (pos === "G") {
			return 0;
		}

		return func(pos);
	};
};

const posCoeffCenter = noGoalieDecorator((pos: string) =>
	pos === "C" ? 2 : 0.5,
);
const posCoeffDefense = noGoalieDecorator((pos: string) =>
	pos === "D" ? 2 : pos === "C" ? 1 : 0.5,
);

const ratingsFormulas: Record<Exclude<RatingKey, "hgt">, RatingFormula> = {
	stre: {
		ageModifier: () => 0,
		changeLimits: () => [-Infinity, Infinity],
		posCoeff: pos => (pos === "D" ? 1 : 0.25),
	},
	spd: {
		ageModifier: (age: number) => {
			if (age <= 27) {
				return 0;
			}

			if (age <= 30) {
				return -2;
			}

			if (age <= 35) {
				return -3;
			}

			if (age <= 40) {
				return -4;
			}

			return -8;
		},
		changeLimits: () => [-12, 2],
		posCoeff: () => 1,
	},
	endu: {
		ageModifier: (age: number) => {
			if (age <= 23) {
				return random.uniform(0, 9);
			}

			if (age <= 30) {
				return 0;
			}

			if (age <= 35) {
				return -2;
			}

			if (age <= 40) {
				return -4;
			}

			return -8;
		},
		changeLimits: () => [-11, 19],
		posCoeff: () => 1,
	},
	pss: {
		ageModifier: () => 0,
		changeLimits: () => [-10, 10],
		posCoeff: posCoeffCenter,
	},
	wst: {
		ageModifier: () => 0,
		changeLimits: () => [-10, 10],
		posCoeff: noGoalieDecorator(() => 1.5),
	},
	sst: {
		ageModifier: () => 0,
		changeLimits: () => [-10, 10],
		posCoeff: noGoalieDecorator((pos: string) => (pos === "C" ? 0.75 : 1.5)),
	},
	stk: {
		ageModifier: () => 0,
		changeLimits: () => [-10, 10],
		posCoeff: noGoalieDecorator((pos: string) => {
			if (pos === "W") {
				return 2;
			}
			if (pos === "C") {
				return 1.5;
			}
			return 0.5;
		}),
	},
	oiq: {
		ageModifier: () => 0,
		changeLimits: () => [-10, 10],
		posCoeff: noGoalieDecorator((pos: string) =>
			pos === "C" ? 2 : pos === "W" ? 1 : 0.5,
		),
	},
	chk: {
		ageModifier: () => 0,
		changeLimits: () => [-10, 10],
		posCoeff: posCoeffDefense,
	},
	blk: {
		ageModifier: () => 0,
		changeLimits: () => [-10, 10],
		posCoeff: posCoeffDefense,
	},
	fcf: {
		ageModifier: () => 0,
		changeLimits: () => [-10, 10],
		posCoeff: posCoeffCenter,
	},
	diq: {
		ageModifier: () => 0,
		changeLimits: () => [-10, 10],
		posCoeff: posCoeffDefense,
	},
	glk: {
		ageModifier: () => 0,
		changeLimits: () => [-10, 10],
		posCoeff: (pos: string) => (pos === "G" ? 2 : 0.1),
	},
};

const calcBaseChange = (age: number, coachingRank: number): number => {
	let val: number;

	if (age <= 21) {
		val = 2;
	} else if (age <= 25) {
		val = 1;
	} else if (age <= 27) {
		val = 0;
	} else if (age <= 29) {
		val = -1;
	} else if (age <= 31) {
		val = -2;
	} else if (age <= 34) {
		val = -3;
	} else if (age <= 40) {
		val = -4;
	} else if (age <= 43) {
		val = -5;
	} else {
		val = -6;
	}

	// Noise
	if (age <= 23) {
		val += helpers.bound(random.realGauss(0, 5), -4, 20);
	} else if (age <= 25) {
		val += helpers.bound(random.realGauss(0, 5), -4, 10);
	} else {
		val += helpers.bound(random.realGauss(0, 3), -2, 4);
	}

	// Modulate by coaching. g.get("numActiveTeams") doesn't exist when upgrading DB, but that doesn't matter
	if (g.hasOwnProperty("numActiveTeams")) {
		if (val >= 0) {
			val *= ((coachingRank - 1) * -0.5) / (g.get("numActiveTeams") - 1) + 1.25;
		} else {
			val *= ((coachingRank - 1) * 0.5) / (g.get("numActiveTeams") - 1) + 0.75;
		}
	}

	return val;
};

const developSeason = (
	ratings: PlayerRatings,
	age: number,
	coachingRank: number = (g.get("numActiveTeams") + 1) / 2,
) => {
	// In young players, height can sometimes increase
	if (age <= 21) {
		const heightRand = Math.random();

		if (heightRand > 0.99 && age <= 20 && ratings.hgt <= 99) {
			ratings.hgt += 1;
		}

		if (heightRand > 0.999 && ratings.hgt <= 99) {
			ratings.hgt += 1;
		}
	}

	const baseChange = calcBaseChange(age, coachingRank);

	for (const key of helpers.keys(ratingsFormulas)) {
		const posCoeff = ratingsFormulas[key].posCoeff(ratings.pos);
		const ageModifier = ratingsFormulas[key].ageModifier(age);
		const changeLimits = ratingsFormulas[key].changeLimits(age);

		ratings[key] = limitRating(
			ratings[key] +
				posCoeff *
					helpers.bound(
						(baseChange + ageModifier) * random.uniform(0.2, 1.2),
						changeLimits[0],
						changeLimits[1],
					),
		);
	}
};

export default developSeason;
