import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, TeamSeason } from "../../common/types";
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
			}
		}

		const tids = new Set(teamSeasons.map(ts => ts.tid));

		const players = await idb.getCopies.players({
			statsTid: tid,
		});
		for (const p of players) {
			p.stats = p.stats.filter(row => row.tid === tid);
		}

		return getHistory(t, teamSeasons, players);
	}
};

export default updateGmHistory;
