import { idb } from "../../db";
import type {
	Player,
	DraftPick,
	MinimalPlayerRatings,
} from "../../../common/types";
import { defaultGameAttributes, g, helpers } from "../../util";
import { draft } from "..";
import range from "lodash/range";

const MIN_AGE = 19;
const MAX_AGE = 35;
const ageShift: Record<number, number> = {
	19: 6.6,
	20: 7.2,
	21: 5.1,
	22: 4.6,
	23: 2.2,
	24: 2.2,
	25: 0.2,
	26: 0.1,
	27: -1.0,
	28: -1.1,
	29: -1.7,
	30: -2.4,
	31: -3.4,
	32: -3.5,
	33: -3.6,
	34: -4.7,
	35: -5.0,
};

const max_shift = Math.max(...Object.values(ageShift));
const min_shift = Math.max(...Object.values(ageShift));

const getAgeShift = (age: number) => {
	if (ageShift.hasOwnProperty(age)) {
		return ageShift[age];
	}

	if (age < MIN_AGE) {
		return max_shift;
	}

	return min_shift;
};

// all this +/- stuff is only really used for the 'current year MOV' prediction & contract value
const iv = [72.7, 7.28, 18.1];
const getMOV = (x: number) => {
	const offset = Math.floor(iv.length / 3);
	let tot = -2.021381747657189;
	for (let i = 0; i < offset; i++) {
		tot += iv[offset + i] * (Math.tanh((x - iv[i]) / iv[2 * offset + i]) + 1.0);
	}
	return tot;
};

// estimated mov per ovr
const o2m: Record<number, number> = {};
for (let i = 0; i <= 100; i++) {
	o2m[i] = getMOV(i);
}
const getO2M = (ovr: number) => {
	if (ovr < 0) {
		return o2m[0];
	}
	if (ovr > 100) {
		return o2m[100];
	}
	return o2m[Math.round(ovr)];
};

// These are the same thing, in different units (supposedly)
const REPLACEMENT_LEVEL_PM = -1.4351774267651591; // [+/-]
const REPLACEMENT_LEVEL_OVR = 44.37; // [ovr]

// expected mov, weight for players, weight for salary cap space
const WEIGHTS = [
	[-1.591, -0.708, 0.497],
	[-0.898, 3.266, 0.304],
	[-0.543, 2.346, 0.184],
];

// draft value. (1) is pos -> %, (2) ovr,pot,age -> %, (3) pos -> ovr
const draftP = [0.27988742, 0.30226007, 0.62866095];
const winp_draft = (ovr: number, pot: number, age: number) => {
	const xv = 4.3341 + ovr * 0.1294 + pot * 0.0343 + age * -0.7099;
	return 1 / (1 + Math.exp(-xv));
};
const draftOVR = [-0.07936123, 21.17839312, -28.19483771];

// team value
const team_mov = [-0.20384938, 0.3719406, 101.37586688];

// salaries to mov
const sA = 4.020403849764475;

const sum = (x: number[]) => {
	let total = 0;
	for (const val of x) {
		total += val;
	}
	return total;
};

const age_shift_int: Record<number, number> = {};
const totalAgeProg = sum(Object.values(ageShift));
for (let age = MIN_AGE; age <= MAX_AGE; age++) {
	let leftOver = 0;
	for (let age2 = age; age2 <= MAX_AGE; age2++) {
		if (ageShift[age2] > 0) {
			leftOver += ageShift[age2];
		}
	}
	if (leftOver > 0) {
		age_shift_int[age] = leftOver / totalAgeProg;
	}
}

const YEARS_TO_MODEL = 3;

// how much of a hometown discount do players get
// otherwise bad teams give up good players in trades too easy
// because they think they'll want an absurd contract & prefer some value
const DISCOUNT = 1;

const evalState = (
	pars: number[][],
	tss: number[],
	salaryCap: number,
	minContract: number,
) => {
	const pred_win_p = [];
	for (let i = 0; i < YEARS_TO_MODEL; i++) {
		if (!pars[i]) {
			pars[i] = [];
		}
		let play = pars[i].filter(p => p >= REPLACEMENT_LEVEL_OVR);
		const original_length = play.length;
		while (play.length < 10) {
			play.push(REPLACEMENT_LEVEL_OVR);
		}
		play.sort((a, b) => b - a);
		play = play.slice(0, 10);

		const play_s =
			sum(play.map((p, i) => Math.exp(i * team_mov[0]) * p)) * team_mov[1] -
			team_mov[2];

		if (!tss[i]) {
			tss[i] = 0;
		}
		const cap_hit = tss[i] + (10 - original_length) * minContract;

		const diff = (salaryCap - cap_hit) / salaryCap;
		const cap_space = Math.max(diff, 0.1 * diff);
		const x = WEIGHTS[i] || WEIGHTS[2];

		// p_mov = play_s + (x[0] + x[1]*cap_space)
		// win_p = 1.0/(1+np.exp(-(p_mov*x[3]+x[2])))

		const ppow = x[0] + x[1] * cap_space + x[2] * play_s;
		const win_p = 1.0 / (1 + Math.exp(-ppow));

		pred_win_p.push(win_p);
	}

	// discount factor for the future, more uncertainty, less sure reward
	//value = [wp*(0.9**(i)) for i,wp in enumerate(win_p)]

	return pred_win_p;
};

const getTeamMOVs = async () => {
	const teamMOVs: Record<number, number> = {};

	const teams = (await idb.cache.teams.getAll()).filter(t => !t.disabled);
	const allTeamStats = await idb.cache.teamStats.getAll();

	for (const { tid } of teams) {
		const ts = allTeamStats.find(
			ts => ts.tid === tid && !ts.playoffs && ts.season === g.get("season"),
		);
		if (!ts) {
			continue;
		}
		let currentMOV = 0;
		const gp = ts.gp + 1e-9;
		const gl = 82 - ts.gp + 1e-9;
		if (ts.gp > 0) {
			currentMOV = (ts.pts - ts.oppPts) / ts.gp;
		}

		// Top 10 players, adjusted for current injuries
		const playerMOVs = (
			await idb.cache.players.indexGetAll("playersByTid", tid)
		)
			.map(p => {
				const ovr = p.ratings[p.ratings.length - 1].ovr;
				const playerMOV =
					(getO2M(ovr) * Math.max(gl - p.injury.gamesRemaining, 0)) / gl;
				return playerMOV;
			})
			.sort((a, b) => b - a)
			.slice(0, 10);
		let estimatedMOV = 0;
		for (const playerMOV of playerMOVs) {
			estimatedMOV += playerMOV;
		}
		teamMOVs[tid] = (gp / 82) * currentMOV + (gl / 82) * estimatedMOV;
	}

	return teamMOVs;
};

const getTeamValue = async (
	players: Player<MinimalPlayerRatings>[],
	picks: DraftPick[],
) => {
	const teamMOVs = await getTeamMOVs();

	const minContract = g.get("minContract");
	const numActiveTeams = g.get("numActiveTeams");
	const salaryCap = g.get("salaryCap");
	const season = g.get("season");

	// turn mov into draft pick and future mov
	const m2pos = (x: number) =>
		Math.round(
			helpers.bound(
				(numActiveTeams - 1) / (1 + Math.exp(0.0048 - 0.4037 * x)),
				0,
				numActiveTeams - 1,
			),
		);
	const m2next = (year: number, mov: number) => {
		const values = [1, 0.5, 0.25, 0.08, 0.03, 0.01, 0.01, 0.01, 0.01, 0.01];
		if (year >= 0 && year < values.length) {
			return values[year] * mov;
		}
		return 0.01 * mov;
	};

	// turn draft picks into specific predictions
	const draftPickInfos = picks.map(dp => {
		const numYearsFromNow =
			typeof dp.season !== "number" ? 0 : dp.season - season;
		const position =
			m2pos(m2next(numYearsFromNow, teamMOVs[dp.originalTid])) +
			numActiveTeams * (dp.round - 1);
		return {
			numYearsFromNow,
			position,
		};
	});

	let pars: number[][] = []; // player value
	let tss: number[] = []; // contracts
	const dpars: number[] = []; // draft value

	// analyze existing contracts
	for (const p of players) {
		const age = season - p.born.year;
		const ovr = p.ratings[p.ratings.length - 1].ovr;
		const yearsLeftOnContract = p.contract.exp - season;
		const con = p.contract.amount;

		let ovr2 = ovr;
		const povrs = [ovr2];

		// compute aging value
		for (const i of range(Math.max(YEARS_TO_MODEL, yearsLeftOnContract))) {
			ovr2 += ageShift[age + i] ?? min_shift;
			povrs.push(ovr2);
		}

		// this is pretty good +/-
		const pmovs = povrs.map(getO2M);
		// this is ... okay estimate of fair contract
		// assumption: max contract is 1/3 salary cap
		const ccont = pmovs.map(
			pmov => (salaryCap / 3) * Math.min(1, (pmov - REPLACEMENT_LEVEL_PM) / sA),
		);
		// how much value do we get each contract year
		const cvals = ccont.map(c => c - con);

		// add existing contract
		for (const i of range(yearsLeftOnContract + 1)) {
			if (!pars[i]) {
				pars[i] = [];
			}
			pars[i].push(povrs[i]);
			if (!tss[i]) {
				tss[i] = 0;
			}
			tss[i] += con;
		}

		// extend contract (at fair price)
		if (yearsLeftOnContract + 1 < YEARS_TO_MODEL) {
			const prev_val = evalState(pars, tss, salaryCap, minContract);

			const tss2 = helpers.deepCopy(tss);
			const pars2 = helpers.deepCopy(pars);

			for (let i = yearsLeftOnContract + 1; i < YEARS_TO_MODEL; i++) {
				pars2[i].push(povrs[i]);
				tss2[i] += Math.max(DISCOUNT * ccont[i], minContract);
			}

			// only if extending is the right thing
			const new_val = evalState(pars2, tss2, salaryCap, minContract);
			for (let i = 0; i < new_val.length; i++) {
				if (prev_val[i] === undefined || new_val[i] > prev_val[i]) {
					pars = pars2;
					tss = tss2;
					break;
				}
			}
		}

		// add excess value into 3 years
		if (yearsLeftOnContract + 1 > YEARS_TO_MODEL) {
			const amount_to_add = sum(cvals.slice(YEARS_TO_MODEL)) / YEARS_TO_MODEL;
			for (let i = 0; i < YEARS_TO_MODEL; i++) {
				if (!tss[i]) {
					tss[i] = 0;
				}
				tss[i] -= amount_to_add;
			}
		}
	}

	// compute draft pick value
	for (const { numYearsFromNow, position } of draftPickInfos) {
		dpars.push(
			0.95 ** numYearsFromNow *
				draftP[1] *
				Math.exp(-draftP[0] * position ** draftP[2]),
		);
	}

	// add draft picks to roster
	// make them zero cost
	for (const { numYearsFromNow, position } of draftPickInfos) {
		const rookieYear = numYearsFromNow + 1;
		if (rookieYear < YEARS_TO_MODEL) {
			let ovr = Math.exp(draftOVR[0] * position) * draftOVR[1] - draftOVR[2];
			for (let i = rookieYear; i < YEARS_TO_MODEL; i++) {
				ovr = ovr + getAgeShift(20 - rookieYear + i);
				if (!pars[i]) {
					pars[i] = [];
				}
				pars[i].push(ovr);
			}
		}
	}

	// add young player value into long-term estimate
	for (const p of players) {
		const age = season - p.born.year;
		const ovr = p.ratings[p.ratings.length - 1].ovr;
		if (age_shift_int[age] !== undefined) {
			dpars.push(age_shift_int[age] * winp_draft(ovr, ovr, age));
		}
	}

	const value = evalState(pars, tss, salaryCap, minContract);
	return sum(value) + sum(dpars);
};

const getTeamValueWrapper = async ({
	tid,
	pidsAdd = [],
	pidsRemove = [],
	dpidsAdd = [],
	dpidsRemove = [],
}: {
	tid: number;
	pidsAdd?: number[];
	pidsRemove?: number[];
	dpidsAdd?: number[];
	dpidsRemove?: number[];
}) => {
	const players = (
		await idb.cache.players.indexGetAll("playersByTid", tid)
	).filter(p => !pidsRemove.includes(p.pid));
	const picks = (
		await idb.cache.draftPicks.indexGetAll("draftPicksByTid", tid)
	).filter(dp => !dpidsRemove.includes(dp.dpid));

	for (const pid of pidsAdd) {
		const p = await idb.cache.players.get(pid);
		if (!p) {
			throw new Error(`No player found for pid ${pid}`);
		}
		players.push(p);
	}

	for (const dpid of dpidsAdd) {
		const dp = await idb.cache.draftPicks.get(dpid);
		if (!dp) {
			throw new Error(`No pick found for dpid ${dpid}`);
		}
		picks.push(dp);
	}

	return getTeamValue(players, picks);
};

const valueChange2 = async (
	tid: number,
	pidsAdd: number[],
	pidsRemove: number[],
	dpidsAdd: number[],
	dpidsRemove: number[],
) => {
	const value0 = await getTeamValueWrapper({ tid });
	console.log("value0", value0);
	const value = await getTeamValueWrapper({
		tid,
		pidsAdd,
		pidsRemove,
		dpidsAdd,
		dpidsRemove,
	});
	console.log("value", value);

	return value - value0;
};

export default valueChange2;
