import limitRating from "./limitRating";
import { helpers, random } from "../../util";
import type { PlayerRatings } from "../../../common/types.basketball";
import { coachingEffect } from "../../../common/budgetLevels";

// peakAge: the age this rating normally peaks
// normalGrowth: amount this rating usually increases per year, until peakAge (modulated a bit by age still, so further from peakAge growth will be higher, and closer to peakAge it will be lower)
// normalDecline: amount this rating usually declines (from peakAge to 40, with similar modulation as normalGrowth)
const ratingsFormulas = {
	// Big growth
	stre: {
		peakAge: 28,
		normalGrowth: 5,
		normalDecline: 2,
	},
	oiq: {
		peakAge: 28,
		normalGrowth: 8,
		normalDecline: 2,
	},
	diq: {
		peakAge: 28,
		normalGrowth: 8,
		normalDecline: 2,
	},
	endu: {
		peakAge: 26,
		normalGrowth: 5,
		normalDecline: 2,
	},

	// Moderate growth
	dnk: {
		peakAge: 25,
		normalGrowth: 2,
		normalDecline: 2,
	},
	drb: {
		peakAge: 30,
		normalGrowth: 2,
		normalDecline: 2,
	},
	fg: {
		peakAge: 30,
		normalGrowth: 3,
		normalDecline: 2,
	},
	ft: {
		peakAge: 30,
		normalGrowth: 3,
		normalDecline: 2,
	},
	ins: {
		peakAge: 30,
		normalGrowth: 2,
		normalDecline: 2,
	},
	pss: {
		peakAge: 30,
		normalGrowth: 2,
		normalDecline: 2,
	},
	reb: {
		peakAge: 30,
		normalGrowth: 2,
		normalDecline: 2,
	},
	tp: {
		peakAge: 30,
		normalGrowth: 3,
		normalDecline: 2,
	},

	// Small growth
	jmp: {
		peakAge: 24,
		normalGrowth: 1,
		normalDecline: 8,
	},
	spd: {
		peakAge: 25,
		normalGrowth: 1,
		normalDecline: 8,
	},
};

const getNormalChange = (
	{
		peakAge,
		normalGrowth,
		normalDecline,
	}: {
		peakAge: number;
		normalGrowth: number;
		normalDecline: number;
	},
	age: number,
) => {
	const ageDiff = age - peakAge;
	if (ageDiff < -3) {
		return normalGrowth;
	} else if (ageDiff === -3) {
		return 0.75 * normalGrowth;
	} else if (ageDiff === -2) {
		return 0.5 * normalGrowth;
	} else if (ageDiff === -1) {
		return 0.25 * normalGrowth;
	} else if (ageDiff === 0) {
		return 0;
	} else if (ageDiff === 1) {
		return -0.25 * normalGrowth;
	} else if (ageDiff === 2) {
		return -0.5 * normalGrowth;
	} else if (ageDiff === 3) {
		return -0.75 * normalGrowth;
	} else {
		return -normalDecline;
	}
};

const SMOOTH_WITH_PREV_PROGS = 0.5;

const developSeason = (
	ratings: PlayerRatings,
	age: number,
	coachingLevel: number,
	prevProgs: Record<string, number> | undefined,
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

	const baseChangeAthleticism = random.uniform(-3, 3);
	const baseChangeShooting = random.uniform(-3, 3);
	const baseChangeOffense = random.uniform(-3, 3);
	const baseChangeDefense = random.uniform(-3, 3);

	const baseChanges = {
		stre: (baseChangeAthleticism + baseChangeDefense) / 2,
		spd: baseChangeAthleticism,
		jmp: baseChangeAthleticism,
		endu: baseChangeAthleticism,
		dnk: (baseChangeAthleticism + baseChangeShooting) / 2,
		ins: (baseChangeOffense + baseChangeShooting) / 2,
		ft: baseChangeShooting,
		fg: baseChangeShooting,
		tp: baseChangeShooting,
		oiq: baseChangeOffense,
		diq: baseChangeDefense,
		drb: baseChangeOffense,
		pss: baseChangeOffense,
		reb: baseChangeDefense,
	};

	for (const key of helpers.keys(ratingsFormulas)) {
		let prog =
			0.7 *
			(getNormalChange(ratingsFormulas[key], age) +
				baseChanges[key] +
				helpers.bound(0 * random.realGauss(), -10, 10));

		prog *= 1 + (prog > 0 ? 1 : -1) * coachingEffect(coachingLevel);

		if (prevProgs) {
			prog =
				(1 - SMOOTH_WITH_PREV_PROGS) * prog +
				SMOOTH_WITH_PREV_PROGS * prevProgs[key];
		}

		ratings[key] = limitRating(ratings[key] + prog);
	}
};

export default developSeason;
