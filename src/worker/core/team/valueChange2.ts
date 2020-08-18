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

const iv = [71.3, 6.65, 17.4];
const getMOV = (x: number) => {
	const offset = Math.floor(iv.length / 3);
	let tot = -1.977479789;
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

const REPLACEMENT_LEVEL = -1.425;

// salaries to mov
const sA = 3.974;

const DRAFT_PICK_MOVS = [
	[0.12913374296107455, 7.702395173297482, 0.9448709119534404],
	[0.1634435362737825, 10.800466295630304, 0.5741272805281132],
	[0.15376070715940388, 13.16485546649397, 0.5015513687766904],
	[0.15744008797681056, 15.168386405668784, 0.44871539479734146],
	[0.14365668890459066, 16.382087641663986, 0.43341028973043805],
	[0.10913478735324955, 16.8271402110163, 0.4739572020965056],
	[0.08762872471828462, 16.67385454430513, 0.4872821645039682],
	[0.07718259382269112, 16.225812656172742, 0.5046645539792276],
	[0.08311482788019467, 15.764561758069739, 0.4537378662822118],
	[0.0687348697126223, 14.96697451957791, 0.48694857028396676],
	[0.06931446375815979, 14.43742528331465, 0.4869362245014235],
	[0.07271012404187446, 13.562653960594034, 0.45759214709213336],
];

const PLAYER_VS_CAP: Record<number, [number, number, number, number]> = {
	0: [-0.164, 0.983, 0.0, 0.0],
	1: [0.622, 0.57, 0.363, 0.091],
	2: [0.76, 0.623, 0.176, 0.026],
	3: [0.897, 0.738, 0.049, 0.056],
	4: [0.788, 0.731, 0.047, 0.054],
	5: [0.248, 0.485, 0.04, 0.076],
};

const YEARS = 7;

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
const m2next = (year: number, mov: number) => {
	if (year > 4) {
		return 0.01;
	}
	return [1, 0.5, 0.25, 0.08, 0.03][year] * mov;
};

const getTeamValue = async (
	tid: number,
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

			return dp.season - g.get("season") < YEARS;
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
	const pars: number[][] = Array(YEARS)
		.fill(0)
		.map(() => []); // player MOVs
	const tss = Array(YEARS).fill(0); // player contract totals
	const dpars: number[][] = Array(YEARS)
		.fill(0)
		.map(() => []); // player MOVs
	const dtss = Array(YEARS).fill(0); // player contract totals

	for (let i = 0; i < YEARS; i++) {
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
				dtss[i] += dsal;
				const yearsSinceDraft = i - (yr + 1);
				const x = DRAFT_PICK_MOVS[yearsSinceDraft];
				dpars[i].push(x[1] * Math.exp(-x[0] * draftPosition ** x[2]));
			}
		}
	}

	// add salaries and player values
	const pred_movs = [];
	for (let i = 0; i < YEARS; i++) {
		let play = pars[i].slice();
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

		const cap_hit = tss[i] + (10 - lp) * 750; //+ dtss[i]

		const diff = (sCap - cap_hit) / (sCap / 3);
		const cap_space = Math.max(diff, 0.1 * diff);
		//mov_from_cap = cap_space*sA

		let play_d = 0;
		for (const value of dpars[i]) {
			play_d += value;
		}

		const x = PLAYER_VS_CAP[i] ? PLAYER_VS_CAP[i] : PLAYER_VS_CAP[5];
		// p_mov = x[0] +  x[1]*play_s + x[2]*mov_from_cap
		// teamMOVs is needed because otherwise it winds up using "lots of good draft picks on team" as a proxy for "bad team"
		const playerMOV =
			x[0] * (sA * cap_space) +
			x[1] * play_s +
			x[2] * teamMOVs[tid] +
			x[3] * play_d;

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
		value += win_p[i] * 0.9 ** i;
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
