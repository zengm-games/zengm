import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents, TeamSeason, Player } from "../../common/types.ts";
import { getHistory, getHistoryTeam } from "./teamHistory.ts";
import { getPlayoffsByConfBySeason } from "./frivolitiesTeamSeasons.ts";

const updateGmHistory = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("gameAttributes")
	) {
		const seasonsByTid: Record<number, Set<number>> = {};
		const teamSeasonsByTeam: TeamSeason[][] = [];
		const teamSeasonsIndex = idb.league
			.transaction("teamSeasons")
			.store.index("season, tid");
		let prevTid: number | undefined;
		for (
			let season = g.get("startingSeason");
			season <= g.get("season");
			season++
		) {
			const tid = g.get("userTid", season);
			if (tid !== prevTid) {
				prevTid = tid;
				teamSeasonsByTeam.push([]);
			}

			let ts;
			if (season === g.get("season")) {
				ts = await idb.cache.teamSeasons.indexGet("teamSeasonsByTidSeason", [
					tid,
					g.get("season"),
				]);
			} else {
				ts = await teamSeasonsIndex.get([season, tid]);
			}
			if (ts) {
				teamSeasonsByTeam.at(-1)!.push(ts);

				if (!seasonsByTid[ts.tid]) {
					seasonsByTid[ts.tid] = new Set();
				}
				seasonsByTid[ts.tid]!.add(season);
			}
		}

		const playoffsByConfBySeason = await getPlayoffsByConfBySeason();
		const teamHistories = [];
		for (const teamSeasons of teamSeasonsByTeam) {
			const group = getHistoryTeam(teamSeasons, playoffsByConfBySeason);

			// This is to filter out when tid is DOES_NOT_EXIST when realStats=="all"
			if (group.history.length > 0) {
				teamHistories.push(group);
			}
		}
		teamHistories.reverse();

		const allTeamSeasons = teamSeasonsByTeam.flat();

		const tids = new Set(allTeamSeasons.map((ts) => ts.tid));

		const players: Player[] = [];
		const addPlayer = (p: Player) => {
			p.stats = p.stats.filter((row) => seasonsByTid[row.tid]?.has(row.season));
			players.push(p);
		};

		// Use statsTids to search for players, unless there are so many teams that it's maybe not worth it
		if (tids.size <= g.get("numTeams") / 2) {
			const pids = new Set<number>();
			for (const tid of tids) {
				for await (const { value: p } of idb.league
					.transaction("players")
					.store.index("statsTids")
					.iterate(tid)) {
					if (pids.has(p.pid)) {
						continue;
					}

					addPlayer(p);
					pids.add(p.pid);
				}
			}
		} else {
			for await (const { value: p } of idb.league.transaction("players")
				.store) {
				let hasTid = false;
				for (const tid of p.statsTids) {
					if (tids.has(tid)) {
						hasTid = true;
						break;
					}
				}
				if (hasTid) {
					addPlayer(p);
				}
			}
		}

		return {
			...(await getHistory(
				allTeamSeasons,
				players,
				playoffsByConfBySeason,
				true,
			)),
			teamHistories,
		};
	}
};

export default updateGmHistory;
