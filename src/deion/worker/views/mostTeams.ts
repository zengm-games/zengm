import { idb } from "../db";
import { g } from "../util";
import { UpdateEvents } from "../../common/types";

const updatePlayers = async (inputs: unknown, updateEvents: UpdateEvents) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun")) {
		const stats =
			process.env.SPORT === "basketball"
				? ["gp", "min", "pts", "trb", "ast", "per", "ewa", "ws", "ws48"]
				: ["gp", "keyStats", "av"];
		const playersAll = await idb.getCopies.players({
			filter: (p: any) => {
				const teams = p.stats.filter(s => s.gp > 0).map(s => s.tid);
				p.numTeams = new Set(teams).size;
				return p.numTeams >= 5;
			},
		});
		let players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"name",
				"draft",
				"retiredYear",
				"statsTids",
				"hof",
				"numTeams",
			],
			ratings: ["ovr", "pos"],
			stats: ["season", "abbrev", "tid", ...stats],
			fuzz: true,
		});
		players.sort((a, b) => b.numTeams - a.numTeams);
		players = players.slice(0, 100);
		return {
			players,
			stats,
			userTid: g.userTid,
		};
	}
};

export default updatePlayers;
