import { idb, iterate } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type { UpdateEvents, Player } from "../../common/types";

export const getMostXPlayers = async ({
	filter,
	metric,
}: {
	filter?: (p: Player) => boolean;
	metric: (p: Player) => number;
}) => {
	const LIMIT = 100;
	const playersAll: (Player & {
		metric: number;
	})[] = [];

	await iterate(
		idb.league.transaction("players").store,
		undefined,
		undefined,
		p => {
			if (filter !== undefined && !filter(p)) {
				return;
			}

			const value = metric(p);

			playersAll.push({
				...p,
				metric: value,
			});

			if (playersAll.length > LIMIT) {
				playersAll.sort((a, b) => b.metric - a.metric);
				playersAll.pop();
			}
		},
	);

	const stats =
		process.env.SPORT === "basketball"
			? ["gp", "min", "pts", "trb", "ast", "per", "ewa", "ws", "ws48"]
			: ["gp", "keyStats", "av"];

	const players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"draft",
			"retiredYear",
			"statsTids",
			"hof",
			"age",
			"ageAtDeath",
			"born",
			"diedYear",
		],
		ratings: ["ovr", "pos"],
		stats: ["season", "abbrev", "tid", ...stats],
		fuzz: true,
	});

	for (let i = 0; i < 100; i++) {
		if (players[i]) {
			players[i].rank = i + 1;
		}
	}

	return {
		players: processPlayersHallOfFame(players),
		stats,
	};
};

const updatePlayers = async (inputs: unknown, updateEvents: UpdateEvents) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun")) {
		const { players, stats } = await getMostXPlayers({
			filter: p =>
				p.stats.length > 0 && p.stats.filter(ps => ps.playoffs).length === 0,
			metric: p => {
				let sum = 0;
				for (const ps of p.stats) {
					sum += ps.gp;
				}
				return sum;
			},
		});

		return {
			players,
			stats,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
