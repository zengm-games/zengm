import { g } from "../util";
import { getMostXPlayers } from "./most";
import type { UpdateEvents } from "../../common/types";

const updatePlayers = async (inputs: unknown, updateEvents: UpdateEvents) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun")) {
		const { players, stats } = await getMostXPlayers({
			metric: p => {
				const age =
					typeof p.diedYear === "number"
						? p.diedYear - p.born.year
						: g.get("season") - p.born.year;
				return age;
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
