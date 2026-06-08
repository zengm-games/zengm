import { realGauss } from "../../../common/random.ts";
import { helpers } from "../../util/index.ts";

type Skills = {
	tp?: number;
	dnk?: number;
	spd?: number;
	ins?: number;
	hgt?: number;
	stre?: number;
	fg?: number;
	oiq?: number;
	pss?: number;
};

const r = (skills: Skills, key: keyof Skills) => skills[key] ?? 50;

// Centered on 50, pulled toward the relevant skill(s), plus noise.
const dial = (base: number, noise = 9) =>
	helpers.bound(Math.round(50 + (base - 50) + realGauss(0, noise)), 0, 100);

// Behavioral tendencies correlated to a player's skills (a great shooter tends to
// shoot more 3s; a big tends to post up), with noise so they're not identical to
// skill. Reused by player generation and the league migration.
const genTendencies = (skills: Skills) => {
	const tp = r(skills, "tp");
	const dnk = r(skills, "dnk");
	const spd = r(skills, "spd");
	const ins = r(skills, "ins");
	const hgt = r(skills, "hgt");
	const stre = r(skills, "stre");
	const fg = r(skills, "fg");
	const oiq = r(skills, "oiq");
	const pss = r(skills, "pss");

	const scoring = (ins + dnk + fg + tp + oiq) / 5;

	return {
		tendencyUsage: dial(50 + (scoring - 50) * 0.5),
		tendencyThree: dial(50 + (tp - 50) * 0.7 + (oiq - 50) * 0.1),
		tendencyAtRim: dial(50 + ((dnk + spd) / 2 - 50) * 0.6),
		tendencyPost: dial(50 + ((ins + hgt + stre) / 3 - 50) * 0.6),
		tendencyPass: dial(50 + ((pss + oiq) / 2 - 50) * 0.6),
		// Clutch is mostly independent of skill (a slight lean on composure/IQ).
		tendencyClutch: dial(50 + (oiq - 50) * 0.1, 14),
	};
};

export default genTendencies;
