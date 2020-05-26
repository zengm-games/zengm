import { g } from "../util";
import { getMostXPlayers } from "./most";
import type { UpdateEvents } from "../../common/types";

const updatePlayers = async (inputs: unknown, updateEvents: UpdateEvents) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun")) {
		const { players, stats } = await getMostXPlayers({
			metric: p => {
				const tids = p.stats.filter(s => s.gp > 0).map(s => s.tid);
				return new Set(tids).size;
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
