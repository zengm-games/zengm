import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { TeamSeason, Player } from "../../common/types.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import {
	getHistoryPlayerProcessor,
	getHistoryTeam,
	historyStats,
} from "./teamHistory.ts";
import { getPlayoffsByConfBySeason } from "./frivolitiesTeamSeasons.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "gmHistory",
	load: async ({ updateEvents }) => {
		if (
			updateEvents.has("firstRun") ||
			updateEvents.has("gameSim") ||
			updateEvents.has("gameAttributes")
		) {
			const seasonsByTid: Record<number, Set<number>> = {};
			const teamSeasonsByTeam: TeamSeason[][] = [];
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

				const ts = await idb.merged.teamSeasons.getByTidSeason(tid, season);
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

			const teamHistory = getHistoryTeam(
				allTeamSeasons,
				playoffsByConfBySeason,
			);
			const processPlayer = getHistoryPlayerProcessor(
				allTeamSeasons,
				teamHistory.history,
				true,
			);

			// Only keep stats from the user's seasons. This makes a new object, so the player in the cache is not changed.
			const getRow = (p: Player) =>
				processPlayer({
					...p,
					stats: p.stats.filter((row) =>
						seasonsByTid[row.tid]?.has(row.season),
					),
				});

			let players;

			// Use statsTids to search for players, unless there are so many teams that it's maybe not worth it
			if (tids.size <= g.get("numTeams") / 2) {
				players = [];
				const pids = new Set<number>();
				for (const tid of tids) {
					// A player who played for several of these teams is found for each one, but only processed the first time. Players with no row are processed again, which is fine because they'll have no row again.
					const playersTid = (
						await idb.merged.players.getAll(
							{ statsTid: tid },
							{
								filter: (p) => !pids.has(p.pid),
								map: getRow,
							},
						)
					).filter((p) => p !== undefined);
					for (const p of playersTid) {
						players.push(p);
						pids.add(p.pid);
					}
				}
			} else {
				players = (
					await idb.merged.players.getAll(undefined, {
						filter: (p) => p.statsTids.some((tid) => tids.has(tid)),
						map: getRow,
					})
				).filter((p) => p !== undefined);
			}

			return {
				...teamHistory,
				players: addFirstNameShort(players),
				stats: historyStats,
				teamHistories,
			};
		}
	},
});
