import { idb, iterate } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, TeamSeason, Player } from "../../common/types";
import { getHistory } from "./teamHistory";

const updateGmHistory = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("gameAttributes")
	) {
		const tid = g.get("userTid");
		const t = await idb.cache.teams.get(tid);
		if (!t) {
			throw new Error("Invalid team ID number");
		}

		const seasonsByTid: Record<number, Set<number>> = {};
		const teamSeasons: TeamSeason[] = [];
		const teamSeasonsIndex = idb.league
			.transaction("teamSeasons")
			.store.index("season, tid");
		for (
			let season = g.get("startingSeason");
			season <= g.get("season");
			season++
		) {
			const ts = await teamSeasonsIndex.get([season, g.get("userTid", season)]);
			if (ts) {
				teamSeasons.push(ts);

				if (!seasonsByTid[ts.tid]) {
					seasonsByTid[ts.tid] = new Set();
				}
				seasonsByTid[ts.tid].add(season);
			}
		}

		const tids = new Set(teamSeasons.map(ts => ts.tid));

		const players: Player[] = [];
		await iterate(
			idb.league.transaction("players").store,
			undefined,
			undefined,
			p => {
				let hasTid = false;
				for (const tid of p.statsTids) {
					if (tids.has(tid)) {
						hasTid = true;
						break;
					}
				}
				if (!hasTid) {
					return;
				}

				p.stats = p.stats.filter(
					row => seasonsByTid[row.tid] && seasonsByTid[row.tid].has(row.season),
				);

				players.push(p);
			},
		);

		return getHistory(t, teamSeasons, players);
	}
};

export default updateGmHistory;
