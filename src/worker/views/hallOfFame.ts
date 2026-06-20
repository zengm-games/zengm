import { PHASE } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { processPlayersHallOfFame } from "../util/processPlayersHallOfFame.ts";

// gpF is used on processPlayersHallOfFame for baseball
export const extraStats = bySport({
	baseball: ["gpF"],
	basketball: [],
	football: [],
	hockey: [],
});

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
		const players = (
			await idb.getCopies.playersPlus(playersAll, {
				attrs: [
					"pid",
					"firstName",
					"lastName",
					"draft",
					"retiredYear",
					"statsTids",
					"awards",
				],
				ratings: ["season", "ovr", "pos"],
				stats: ["season", "abbrev", "tid", ...stats, ...extraStats],
				fuzz: true,
			})
		).map((p) => {
			p.countMvp = 0;
			p.countTitles = 0;
			for (const award of p.awards) {
				if (award.type === "Most Valuable Player") {
					p.countMvp += 1;
				} else if (award.type === "Won Championship") {
					p.countTitles += 1;
				}
			}
			delete p.awards;
			return p;
		});

		return {
			players: addFirstNameShort(processPlayersHallOfFame(players)),
			stats,
		};
	}
};

export default updatePlayers;
