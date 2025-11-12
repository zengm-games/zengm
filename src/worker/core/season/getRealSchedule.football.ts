import { choice, shuffle } from "../../../common/random.ts";
import g from "../../util/g.ts";

const NUM_CONFS = 2;
const NUM_DIVS_PER_CONF = 4;
const NUM_TEAMS_PER_DIV = 4;
const NUM_GAMES_PER_TEAM = 17;

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
	if (g.get("numGames") !== NUM_GAMES_PER_TEAM) {
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

	console.log(cids, didsByCid, tidsByDid);
	const tids: [number, number][] = [];

	for (const { day, matchups } of schedule) {
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

	return tids;
};
