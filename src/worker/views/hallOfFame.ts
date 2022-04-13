import { bySport, PHASE } from "../../common";
import { idb } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type { UpdateEvents } from "../../common/types";
import addFirstNameShort from "../util/addFirstNameShort";

const updatePlayers = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		(updateEvents.includes("newPhase") &&
			g.get("phase") === PHASE.DRAFT_LOTTERY)
	) {
		const stats = bySport({
			baseball: ["keyStats", "war"],
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
				hof: true,
			},
			"noCopyCache",
		);
		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"firstName",
				"lastName",
				"draft",
				"retiredYear",
				"statsTids",
			],
			ratings: ["ovr", "pos"],
			stats: ["season", "abbrev", "tid", ...stats],
			fuzz: true,
		});

		return {
			players: addFirstNameShort(processPlayersHallOfFame(players)),
			stats,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
