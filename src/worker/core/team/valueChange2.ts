import { idb } from "../../db";
import type {
	Player,
	DraftPick,
	MinimalPlayerRatings,
} from "../../../common/types";
import { defaultGameAttributes, g, helpers } from "../../util";
import { draft } from "..";
import groupBy from "lodash/groupBy";
import range from "lodash/range";
import { PHASE, PLAYER } from "../../../common";
import { playoffSeries } from "../../db/getCopies";

const PLACEHOLDER_VALUE_ALREADY_PICKED = -1;

// probability of player being the best player on a team that makes it to the 2nd round
const winp_draft = (ovr: number, pot: number, age: number) => {
	const xv = 4.3341 + ovr * 0.1294 + pot * 0.0343 + age * -0.7099;
	return 1 / (1 + Math.exp(-xv));
};

/**
 * Estimate draft pick values, based on the generated draft prospects in the database.
 *
 * This was made for team.valueChange, so it could be called once and the results cached.
 *
 * @memberOf core.trade
 * @return {Promise.Object} Resolves to estimated draft pick values.
 */
const getDraftProspectValues = async () => {
	const players = (
		await idb.cache.players.indexGetAll("playersByTid", PLAYER.UNDRAFTED)
	).map(p => ({
		ageAtDraft: p.draft.year - p.born.year,
		ovr: p.ratings[p.ratings.length - 1].ovr,
		value: winp_draft(
			p.ratings[p.ratings.length - 1].ovr,
			p.ratings[p.ratings.length - 1].pot,
			p.draft.year - p.born.year,
		),
		draftYear: p.draft.year,
	}));
	players.sort((a, b) => b.value - a.value);
	const playersByDraftYear = groupBy(players, p => p.draftYear);

	let maxLength = 0;
	for (const players of Object.values(playersByDraftYear)) {
		if (players.length > maxLength) {
			maxLength = players.length;
		}
	}

	// Handle case where draft is in progress
	if (g.get("phase") === PHASE.DRAFT) {
		// See what the lowest remaining pick is
		const numPicks = g.get("numDraftRounds") * g.get("numActiveTeams");
		const draftPicks = (await idb.cache.draftPicks.getAll()).filter(
			dp => dp.season === g.get("season"),
		);
		const diff = numPicks - draftPicks.length;

		if (diff > 0) {
			// Value of PLACEHOLDER_VALUE_ALREADY_PICKED is arbitrary since these entries should never appear in a trade since the picks don't exist anymore
			const fakeValues = Array(diff).fill({
				ageAtDraft: PLACEHOLDER_VALUE_ALREADY_PICKED,
				ovr: 0,
				pot: 0,
			});
			playersByDraftYear[g.get("season")] = fakeValues.concat(
				playersByDraftYear[g.get("season")],
			);
		}
	}

	// Defaults are the average of future drafts
	const seasons = Object.keys(playersByDraftYear);
	const currentSeasonString = String(g.get("season"));
	playersByDraftYear.default = range(maxLength).map(i => {
		const vals = seasons
			.filter(season => {
				if (
					!playersByDraftYear[season][i] ||
					(g.get("phase") === PHASE.DRAFT &&
						season === currentSeasonString &&
						playersByDraftYear[season][i].ageAtDraft ===
							PLACEHOLDER_VALUE_ALREADY_PICKED)
				) {
					return false;
				}

				return true;
			})
			.map(season => playersByDraftYear[season][i]);
		const p = vals.reduce(
			(total, val) => ({
				ageAtDraft: total.ageAtDraft + val.ageAtDraft,
				ovr: total.ovr + val.ovr,
				value: total.value + val.value,
				draftYear: 0,
			}),
			{
				ageAtDraft: 0,
				ovr: 0,
				value: 0,
				draftYear: 0,
			},
		);

		p.ageAtDraft /= vals.length;
		p.ovr /= vals.length;
		p.value /= vals.length;

		return p;
	});

	return playersByDraftYear;
};

/**
 * nicidob says:
 * 
 * the accounting currency here is something like "make second round" (or whatever round). 
 * 1. There's a straightforward formula for that based on roster and cap space. 
 * 2. Draft picks are estimated as "chance of becoming the best player on such a 2nd round team"
 * 
 * but there's 2 major hacks I implemented to make it more practical 
1a. more than 3 years out, predicting is worthless, so just estimate leftover contract value and add it back in credit towards salary cap (HACK)
 * 3. there's a disconnect between (1) and (2), so try and have young players count as partial credit towards the draft pick they once were. (HACK)
 */

const MIN_AGE = 19;
const MAX_AGE = 35;
const ageShift: Record<number, number> = {
	19: 6.6,
	20: 7.0,
	21: 5.1,
	22: 4.5,
	23: 2.4,
	24: 2.4,
	25: 0.2,
	26: 0.1,
	27: -0.9,
	28: -1.0,
	29: -1.6,
	30: -2.3,
	31: -3.4,
	32: -3.6,
	33: -3.7,
	34: -4.7,
	35: -5.1,
};

const max_shift = Math.max(...Object.values(ageShift));
const min_shift = Math.min(...Object.values(ageShift));

const getAgeShift = (age: number) => {
	if (ageShift.hasOwnProperty(age)) {
		return ageShift[age];
	}

	if (age < MIN_AGE) {
		return max_shift;
	}

	return min_shift;
};

// all this +/- stuff is used for
// * the 'current year MOV' prediction & contract value
// * projecting salary.
const getO2M = (ovr: number) => {
	const iv = [72.7, 7.28 * 2, 18.1 / 2];
	const minVal = -2.021381747657189;
	return minVal + iv[1] / (1 + Math.exp(-(ovr - iv[0]) / iv[2]));
};

// These are the same thing, in different units (supposedly)
const REPLACEMENT_LEVEL_PM = -1.4351774267651591; // [+/-]
const REPLACEMENT_LEVEL_OVR = 44.37; // [ovr]

// expected mov, weight for players, weight for salary cap space
const WEIGHTS = [
	[-2.849, -2.235, 0.544],
	[-1.723, 3.316, 0.368],
	[-1.225, 2.212, 0.217],
];

// team value
const team_mov = [-0.21133543900273594, 0.35989254239441687, 96.76582740557117];

// salaries to mov
const sA = 3.8;

const sum = (x: number[]) => {
	let total = 0;
	for (const val of x) {
		total += val;
	}
	return total;
};

const percentOfProgsLeftCache: Record<number, Record<number, number>> = {};
const percentOfProgsLeft = (age: number, draft_age: number) => {
	if (!percentOfProgsLeftCache[age]) {
		percentOfProgsLeftCache[age] = {};
	}
	if (percentOfProgsLeftCache[age][draft_age]) {
		return percentOfProgsLeftCache[age][draft_age];
	}

	let total = 0;
	let seen = 0;
	for (let i = draft_age; i < 27; i++) {
		if (ageShift[i] > 0) {
			total += ageShift[i];
			if (i < age) {
				seen += ageShift[i];
			}
		}
	}

	const percent = total === 0 ? 0 : 1 - seen / total;
	percentOfProgsLeftCache[age][draft_age] = 1 - seen / total;
	return percent;
};

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

		// Give boost to top players. Without this, teams will be too eager to add depth at the expense of stars. Which... is actually the correct thing to do in BBGM today, because depth is overvalued.
		play = play.map(
			(p, i) => (1 + (g.get("tradeAIValueStars") / 100) * Math.exp(-i / 2)) * p,
		);

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
	tid: number,
	players: Player<MinimalPlayerRatings>[],
	picks: DraftPick[],
) => {
	const difficultyFudgeFactor = helpers.bound(
		1 + 0.1 * g.get("difficulty"),
		0,
		Infinity,
	); // 2.5% bonus for easy, 2.5% penalty for hard, 10% penalty for insane

	// Fudge factor for AI overvaluing its own players
	const fudgeFactor = tid !== g.get("userTid") ? difficultyFudgeFactor : 1;

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

		let position;
		if (dp.pick > 0) {
			position = dp.pick;
		} else {
			position = m2pos(m2next(numYearsFromNow, teamMOVs[dp.originalTid]));
		}

		// Penalty for user draft picks
		if (dp.originalTid === g.get("userTid")) {
			position = helpers.bound(
				Math.round(position + g.get("numActiveTeams") / 4),
				1,
				g.get("numActiveTeams"),
			);
		}

		// Account for round
		position += numActiveTeams * (dp.round - 1);

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

		let ovr2 = ovr * fudgeFactor;
		const povrs = [ovr2];

		// compute aging value
		for (const i of range(Math.max(YEARS_TO_MODEL, yearsLeftOnContract))) {
			ovr2 += getAgeShift(age + i);
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

	const draftProspectValues = await getDraftProspectValues();
	const getDraftProspect = (season: number, position: number) => {
		if (draftProspectValues[season]) {
			if (draftProspectValues[season][position]) {
				return draftProspectValues[season][position];
			}

			return draftProspectValues[season][
				draftProspectValues[season].length - 1
			];
		}

		if (draftProspectValues.default[position]) {
			return draftProspectValues.default[position];
		}

		return draftProspectValues.default[draftProspectValues.default.length - 1];
	};

	// compute draft pick value
	for (const { numYearsFromNow, position } of draftPickInfos) {
		const draftProspectInfo = getDraftProspect(
			g.get("season") + numYearsFromNow,
			position - 1,
		);
		dpars.push(draftProspectInfo.value);
	}

	// add draft picks to roster
	// make them zero cost
	for (const { numYearsFromNow, position } of draftPickInfos) {
		const rookieYear = numYearsFromNow + 1;
		if (rookieYear < YEARS_TO_MODEL) {
			const draftProspectInfo = getDraftProspect(
				g.get("season") + numYearsFromNow,
				position - 1,
			);
			let ovr = fudgeFactor * draftProspectInfo.ovr;
			for (let i = 0; i < YEARS_TO_MODEL; i++) {
				ovr += getAgeShift(draftProspectInfo.ageAtDraft + 1 + i);
				if (!pars[i]) {
					pars[i] = [];
				}
				pars[i].push(ovr);
			}
		}
	}

	// add young player value into long-term estimate - this is basically giving a boost of long term value to very young players (age_shift_int declines very fast with age) so young prospects won't be seen as negative value
	for (const p of players) {
		const age = season - p.born.year;
		const ageAtDraft = p.draft.year - p.born.year;
		const { ovr, pot } = p.ratings[p.ratings.length - 1];
		dpars.push(
			fudgeFactor *
				percentOfProgsLeft(age, ageAtDraft) *
				winp_draft(ovr, pot, age),
		);
	}

	const value = evalState(pars, tss, salaryCap, minContract);

	return (
		(1 - g.get("tradeAIValueFuture")) * sum(value) +
		g.get("tradeAIValueFuture") * sum(dpars)
	);
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

	return getTeamValue(tid, players, picks);
};

const valueChange2 = async (
	tid: number,
	pidsAdd: number[],
	pidsRemove: number[],
	dpidsAdd: number[],
	dpidsRemove: number[],
) => {
	const value0 = await getTeamValueWrapper({ tid });
	const value = await getTeamValueWrapper({
		tid,
		pidsAdd,
		pidsRemove,
		dpidsAdd,
		dpidsRemove,
	});

	return value - value0;
};

export default valueChange2;
