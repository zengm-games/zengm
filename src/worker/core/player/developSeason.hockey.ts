import { helpers } from "../../util/index.ts";
import type { PlayerRatings, RatingKey } from "../../../common/types.hockey.ts";
import { uniform, realGauss } from "../../../common/random.ts";
import {
	addToProgBreakdown,
	getBaseChange,
	getRatingChangeBreakdown,
	type ProgBreakdown,
} from "./developmentBreakdown.ts";

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
		posCoeff: (pos) => (pos === "D" ? 1 : 0.25),
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
				return uniform(0, 9);
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

const calcBaseChange = (age: number, coachingLevel: number) => {
	let ageChange: number;

	if (age <= 21) {
		ageChange = 2;
	} else if (age <= 25) {
		ageChange = 1;
	} else if (age <= 27) {
		ageChange = 0;
	} else if (age <= 29) {
		ageChange = -1;
	} else if (age <= 31) {
		ageChange = -2;
	} else if (age <= 34) {
		ageChange = -3;
	} else if (age <= 40) {
		ageChange = -4;
	} else if (age <= 43) {
		ageChange = -5;
	} else {
		ageChange = -6;
	}

	let randomChange;

	// Noise
	if (age <= 23) {
		randomChange = helpers.bound(realGauss(0, 5), -4, 20);
	} else if (age <= 25) {
		randomChange = helpers.bound(realGauss(0, 5), -4, 10);
	} else {
		randomChange = helpers.bound(realGauss(0, 3), -2, 4);
	}

	return getBaseChange(ageChange, randomChange, coachingLevel);
};

const developSeason = (
	ratings: PlayerRatings,
	age: number,
	coachingLevel: number,
) => {
	const progBreakdown: ProgBreakdown = [0, 0, 0];

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

	const baseChange = calcBaseChange(age, coachingLevel);

	for (const key of helpers.keys(ratingsFormulas)) {
		const posCoeff = ratingsFormulas[key].posCoeff(ratings.pos);
		const ageModifier = ratingsFormulas[key].ageModifier(age);
		const changeLimits = ratingsFormulas[key].changeLimits(age);
		const { newRating, progBreakdown: ratingProgBreakdown } =
			getRatingChangeBreakdown({
				ageModifier,
				baseChange,
				changeLimits,
				factor: uniform(0.2, 1.2),
				oldRating: ratings[key],
				scale: posCoeff,
			});

		ratings[key] = newRating;
		addToProgBreakdown(progBreakdown, ratingProgBreakdown);
	}

	return progBreakdown;
};

export default developSeason;
