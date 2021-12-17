import { bySport, PHASE } from "../../common";
import { idb } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type { UpdateEvents } from "../../common/types";

const updatePlayers = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		(updateEvents.includes("newPhase") &&
			g.get("phase") === PHASE.DRAFT_LOTTERY)
	) {
		const stats = bySport({
			basketball: [
				"gp",
				"min",
				"pts",
				"trb",
				"ast",
				"per",
				"ewa",
				"ws",
				"ws48",
			],
			football: ["keyStats", "av"],
			hockey: ["keyStats", "ops", "dps", "ps"],
		});
		const playersAll = await idb.getCopies.players(
			{
				filter: p => p.hof,
			},
			"noCopyCache",
		);
		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: ["pid", "name", "draft", "retiredYear", "statsTids"],
			ratings: ["ovr", "pos"],
			stats: ["season", "abbrev", "tid", ...stats],
			fuzz: true,
		});

		return {
			players: processPlayersHallOfFame(players),
			stats,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
