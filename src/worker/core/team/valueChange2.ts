import { idb } from "../../db";
import type {
	Player,
	DraftPick,
	MinimalPlayerRatings,
} from "../../../common/types";
import { defaultGameAttributes, g, helpers } from "../../util";
import { draft } from "..";

const ageShift: Record<number, number> = {
	19: 6.4,
	20: 6.7,
	21: 5.0,
	22: 4.4,
	23: 2.2,
	24: 2.0,
	25: 0.1,
	26: -0.1,
	27: -1.2,
	28: -1.4,
	29: -2.0,
	30: -2.7,
	31: -3.6,
	32: -3.7,
	33: -3.7,
	34: -4.7,
	35: -5.1,
};

const max_shift = Math.max(...Object.values(ageShift));
const min_shift = Math.max(...Object.values(ageShift));

const getAgeShift = (age: number) => {
	if (ageShift.hasOwnProperty(age)) {
		return ageShift[age];
	}

	if (age < 19) {
		return max_shift;
	}

	return min_shift;
};

const iv = [74.7, 7.92, 20.8];
const getMOV = (x: number) => {
	const offset = Math.floor(iv.length / 3);
	let tot = -2.2492;
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

const FAKE_RESIGN = false;

const RESIGN_CHANCE = 0.5;

const REPLACEMENT_LEVEL = -1.306;

// draft model's baseline.
// probably should always be above replacement
// not because they are, but because otherwise they're a pain
const DRAFT_LEVEL = REPLACEMENT_LEVEL;

// salaries to mov
const sA = 3.15;
const sB = 0;

const DRAFT_PICK_MOVS = [
	[0.18897327219231208, 2.0010846899420685, 0.3732236160572243],
	[0.14727349526599293, 2.3890953884900448, 0.37877293453467575],
	[0.20993957998560997, 2.972927445404096, 0.29807102822209075],
	[0.2211666767279284, 3.449578532596238, 0.29588454235265493],
	[0.2204425469188902, 3.8786269293613316, 0.30687612009524046],
];

// expected mov, weight for players, weight for salary cap space
const PLAYER_VS_CAP: Record<number, [number, number, number]> = {
	0: [0, 1.0, 0],
	1: [0, 1.0, 0.9],
	2: [0, 1.0, 0.8],
	3: [0, 1.0, 0.6],
	4: [0, 1.0, 0.5],
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
					(o2m[ovr] * Math.max(gl - p.injury.gamesRemaining, 0)) / gl;
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

// turn mov into draft pick and future mov
const m2pos = (x: number) =>
	Math.round(helpers.bound(29 / (1 + Math.exp(0.0036 - 0.368 * x)), 0, 29));
const m2next = (year: number, mov: number) =>
	[1, 0.5, 0.25, 0.08, 0.03][year] * mov;

const getTeamValue = async (
	players: Player<MinimalPlayerRatings>[],
	picks: DraftPick[],
) => {
	const teamMOVs = await getTeamMOVs();

	const sCap = g.get("salaryCap");
	const sCapS = sCap / defaultGameAttributes.salaryCap;

	// turn draft picks into specific predictions
	const draftPicks = picks
		.filter(dp => {
			if (typeof dp.season !== "number") {
				return true;
			}

			return dp.season - g.get("season") < 5;
		})
		.map(dp => {
			const year =
				typeof dp.season !== "number" ? 0 : dp.season - g.get("season");
			return [
				year,
				m2pos(m2next(year, teamMOVs[dp.originalTid])) +
					g.get("numActiveTeams") * (dp.round - 1),
			];
		}) as [number, number][];

	const rookieSalaries = draft.getRookieSalaries();

	// for this and the next 4 years
	const pars: [number[], number[], number[], number[], number[]] = [
		[],
		[],
		[],
		[],
		[],
	]; // player MOVs
	const tss = [0, 0, 0, 0, 0]; // payrolls

	for (let i = 0; i < 5; i++) {
		for (const p of players) {
			const age = g.get("season") - p.born.year;
			const ovr = p.ratings[p.ratings.length - 1].ovr;
			const con = p.contract.amount;
			const yrl = p.contract.exp - g.get("season");
			if (yrl >= i) {
				// are we on the team still?
				tss[i] += con;
				let ovr2 = ovr;
				for (let j = 0; j < i; j++) {
					ovr2 += getAgeShift(age + j);
				}
				pars[i].push(o2m[Math.round(helpers.bound(ovr2, 0, 100))]);
			} else if (FAKE_RESIGN) {
				let ovr2 = ovr;
				for (let j = 0; j < i; j++) {
					ovr2 += getAgeShift(age + j);
				}
				const playerMOV = o2m[Math.round(helpers.bound(ovr2, 0, 100))];
				if (playerMOV > 0) {
					// resign positive MOV contributors
					const est_con =
						Math.min(1, (playerMOV - REPLACEMENT_LEVEL) / sA) *
						g.get("maxContract");
					tss[i] += est_con * RESIGN_CHANCE;
					pars[i].push(RESIGN_CHANCE * playerMOV);
				}
			}
		}

		for (const [yr, draftPosition] of draftPicks) {
			if (yr + 1 <= i) {
				// if drafted
				const dsal = sCapS * rookieSalaries[draftPosition];
				tss[i] += dsal;
				const yearsSinceDraft = i - (yr + 1);
				const x = DRAFT_PICK_MOVS[yearsSinceDraft];
				pars[i].push(
					DRAFT_LEVEL + x[1] * Math.exp(-x[0] * draftPosition ** x[2]),
				);
			}
		}
	}

	// add salaries and player values
	const pred_movs = [];
	for (let i = 0; i < 5; i++) {
		let play = pars[i].filter(p => p >= REPLACEMENT_LEVEL);
		const lp = play.length;
		while (play.length < 10) {
			play.push(REPLACEMENT_LEVEL);
		}
		play.sort((a, b) => b - a);
		play = play.slice(0, 10);

		let play_s = 0;
		for (const value of play) {
			play_s += value;
		}
		const salary_s = tss[i] + (10 - lp) * g.get("minContract");
		const cap_space = ((1.0 / 3.0) * Math.max(sCap - salary_s, 0)) / sCap;
		const mov_from_cap = cap_space * sA;

		const x = PLAYER_VS_CAP[i];
		const playerMOV = x[0] + x[1] * play_s + x[2] * mov_from_cap;
		pred_movs.push(playerMOV);
	}

	// turn mov into win probs
	//const cA = 0.46421272651304596;
	//const cB = -5.12021285460421;
	// turn mov into 'make the finals'
	const cA = 0.42422076396359476;
	const cB = -3.94406073999211;

	const win_p = pred_movs.map(mov => 1.0 / (1 + Math.exp(-mov * cA - cB)));

	let value = 0;
	for (let i = 0; i < win_p.length; i++) {
		// discount factor for the future, more uncertainty, less sure reward
		value += win_p[i] * 0.8 ** i;
	}
	return value;
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
