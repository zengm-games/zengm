import { bySport, PHASE } from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g, processPlayersHallOfFame } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";

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
			ratings: ["season", "ovr", "pos"],
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
