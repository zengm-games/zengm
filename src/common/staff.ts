import { helpers } from "./helpers.ts";
import { bySport } from "./sportFunctions.ts";

export const COACH_SLOTS = ["headCoach", "assistant1", "assistant2"] as const;
export type CoachSlot = (typeof COACH_SLOTS)[number];

export const COACH_SLOT_NAMES: Record<CoachSlot, string> = {
	headCoach: "Head Coach",
	assistant1: "Assistant 1",
	assistant2: "Assistant 2",
};

export const COACH_SPECIALTIES = bySport({
	baseball: ["hitting", "pitching", "fielding"],
	basketball: ["perimeter", "interior", "shooting", "defense"],
	football: ["offense", "defense", "specialTeams"],
	hockey: ["offense", "defense", "goaltending"],
} as const);

export type CoachSpecialty = (typeof COACH_SPECIALTIES)[number];

export const COACH_SPECIALTY_NAMES: Record<CoachSpecialty, string> = {
	defense: "Defense",
	fielding: "Fielding",
	goaltending: "Goaltending",
	hitting: "Hitting",
	interior: "Interior",
	offense: "Offense",
	perimeter: "Perimeter",
	pitching: "Pitching",
	shooting: "Shooting",
	specialTeams: "Special Teams",
};

const COACH_SPECIALTY_RATINGS = bySport<
	Partial<Record<CoachSpecialty, string[]>>
>({
	baseball: {
		fielding: ["spd", "gnd", "fly", "thr", "cat"],
		hitting: ["hpw", "con", "eye"],
		pitching: ["ppw", "ctl", "mov", "endu"],
	},
	basketball: {
		defense: ["diq", "drb", "stre"],
		interior: ["stre", "dnk", "ins", "reb"],
		perimeter: ["spd", "jmp", "drb", "pss", "oiq"],
		shooting: ["ft", "fg", "tp"],
	},
	football: {
		defense: ["pcv", "tck", "prs", "rns"],
		offense: ["thv", "thp", "tha", "bsc", "elu", "rtr", "hnd", "rbk", "pbk"],
		specialTeams: ["kpw", "kac", "ppw", "pac"],
	},
	hockey: {
		defense: ["chk", "blk", "fcf", "diq"],
		goaltending: ["glk"],
		offense: ["pss", "wst", "sst", "stk", "oiq"],
	},
});

export type CoachingEffectInput =
	| number
	| {
			level: number;
			specialties?: CoachSpecialty[];
	  };

export const getCoachingLevel = (coaching: CoachingEffectInput) =>
	typeof coaching === "number" ? coaching : coaching.level;

const SPECIALTY_BONUS_PER_COACH = 0.04;
const MAX_SPECIALTY_BONUS = SPECIALTY_BONUS_PER_COACH * COACH_SLOTS.length;

export const getCoachSpecialtyBonus = (
	coaching: CoachingEffectInput,
	ratingKey: string,
) => {
	if (typeof coaching === "number" || !coaching.specialties) {
		return 0;
	}

	let matches = 0;
	for (const specialty of coaching.specialties) {
		if (COACH_SPECIALTY_RATINGS[specialty]?.includes(ratingKey)) {
			matches += 1;
		}
	}

	return Math.min(matches * SPECIALTY_BONUS_PER_COACH, MAX_SPECIALTY_BONUS);
};

export const applyCoachSpecialtyChange = (
	change: number,
	coaching: CoachingEffectInput,
	ratingKey: string,
) => {
	const bonus = getCoachSpecialtyBonus(coaching, ratingKey);
	if (bonus === 0 || change === 0) {
		return change;
	}

	return change > 0 ? change * (1 + bonus) : change * (1 - bonus);
};

export const getCoachQualityGrade = (quality: number) => {
	const bounded = helpers.bound(Math.round(quality), 1, 100);
	if (bounded >= 90) {
		return "A";
	}
	if (bounded >= 75) {
		return "B";
	}
	if (bounded >= 55) {
		return "C";
	}
	if (bounded >= 35) {
		return "D";
	}
	return "F";
};
