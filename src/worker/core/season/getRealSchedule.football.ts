import { choice, shuffle } from "../../../common/random.ts";
import g from "../../util/g.ts";

const NUM_CONFS = 2;
const NUM_DIVS_PER_CONF = 4;
const NUM_TEAMS_PER_DIV = 4;
const NUM_GAMES = 17;
const NUM_GAMES_CONF = 6;
const NUM_GAMES_DIV = 6;

type RealSchedules = {
	schedules: {
		day: number;
		matchups: [number, number][];
	}[][];
	teamInfos: Record<number, [number, number, number]>;
};

let cachedJSON: RealSchedules;
const loadData = async () => {
	if (cachedJSON) {
		return cachedJSON;
	}
	const response = await fetch("/gen/real-schedules.json");
	if (!response.ok) {
		throw new Error(`HTTP error ${response.status}`);
	}
	cachedJSON = await response.json();
	return cachedJSON;
};

export const getRealSchedule = async (
	teamsInput: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[],
) => {
	if (
		g.get("numGames") !== NUM_GAMES ||
		g.get("numGamesConf") !== NUM_GAMES_CONF ||
		g.get("numGamesDiv") !== NUM_GAMES_DIV
	) {
		return;
	}

	const didsByCidMap = new Map<number, Set<number>>();
	const numTeamsByDid = new Map<number, number>();
	for (const t of teamsInput) {
		const { cid, did } = t.seasonAttrs;

		const divs = didsByCidMap.get(cid) ?? new Set();
		divs.add(did);
		didsByCidMap.set(cid, divs);

		const numTeams = numTeamsByDid.get(did) ?? 0;
		numTeamsByDid.set(did, numTeams + 1);
	}

	if (
		didsByCidMap.size !== NUM_CONFS ||
		Array.from(didsByCidMap.values()).some(
			(dids) => dids.size !== NUM_DIVS_PER_CONF,
		) ||
		Array.from(numTeamsByDid.values()).some(
			(numTeams) => numTeams !== NUM_TEAMS_PER_DIV,
		)
	) {
		return;
	}

	const { schedules, teamInfos } = await loadData();

	const schedule = choice(schedules);

	// Randomize order of cid/did/tid lookup into teamInfos
	const teams = teamsInput.map((t) => {
		return {
			tid: t.tid,
			cid: t.seasonAttrs.cid,
			did: t.seasonAttrs.did,
		};
	});
	shuffle(teams);
	const cids = Array.from(didsByCidMap.keys());
	shuffle(cids);
	const didsByCid: Record<number, number[]> = {};
	for (const [cid, didsSet] of didsByCidMap) {
		const dids = Array.from(didsSet);
		shuffle(dids);
		didsByCid[cid] = dids;
	}
	const tidsByDid: Record<number, number[]> = {};
	for (const t of teams) {
		const { did, tid } = t;
		if (!tidsByDid[did]) {
			tidsByDid[did] = [];
		}
		tidsByDid[did].push(tid);
	}

	const tids: [number, number][] = [];

	// Add trade deadline and All-Star Game - do it here rather than in newSchedule so we can put it neatly in between days
	let tradeDeadlineDay;
	let allStarGameDay;
	const tradeDeadline = g.get("tradeDeadline");
	const allStarGame = g.get("allStarGame");
	const numDays = schedule.length;
	if (tradeDeadline < 1) {
		tradeDeadlineDay = Math.round(tradeDeadline * numDays) + 1;
	}
	if (allStarGame !== null && allStarGame >= 0) {
		allStarGameDay = Math.round(allStarGame * numDays) + 1;
	}

	let addedAllStarGame = false;

	for (const { day, matchups } of schedule) {
		if (day === tradeDeadlineDay) {
			tids.push([-3, -3]);
		}
		if (day === allStarGameDay) {
			tids.push([-1, -2]);
			addedAllStarGame = true;
		}

		for (const matchup of matchups) {
			const actualMatcup = matchup.map((teamInfosIndex) => {
				const teamInfo = teamInfos[teamInfosIndex];
				if (!teamInfo) {
					throw new Error("Should never happen");
				}
				const [indexConf, indexWithinConf, indexWithinDiv] = teamInfo;
				const cid = cids[indexConf]!;
				const did = didsByCid[cid]![indexWithinConf]!;
				const tid = tidsByDid[did]![indexWithinDiv]!;
				return tid;
			}) as [number, number];
			tids.push(actualMatcup);
		}
	}

	// In case All-Star Game is after the last day. Trade deadline doesn't matter at this point so leave it out.
	if (!addedAllStarGame && allStarGameDay !== undefined) {
		tids.push([-1, -2]);
	}

	return tids;
};
