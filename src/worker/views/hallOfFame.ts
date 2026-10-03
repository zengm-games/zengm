import { PHASE } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { processPlayersHallOfFame } from "../util/processPlayersHallOfFame.ts";
import { defineView } from "../util/defineView.ts";

// gpF is used on processPlayersHallOfFame for baseball
export const extraStats = bySport({
	baseball: ["gpF"],
	basketball: [],
	football: [],
	hockey: [],
} as const);

export default defineView({
	id: "hallOfFame",
	load: async ({ updateEvents }) => {
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
			} as const);
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
			).map(({ awards, ...p }) => {
				let countMvp = 0;
				let countTitles = 0;
				for (const award of awards) {
					if (
						award.type === undefined &&
						award.numTeams === undefined &&
						award.actAs === "mvp" &&
						award.rank === 1
					) {
						countMvp += 1;
					} else if (award.type === "Won Championship") {
						countTitles += 1;
					}
				}
				return {
					...p,
					countMvp,
					countTitles,
				};
			});

			return {
				players: addFirstNameShort(processPlayersHallOfFame(players)),
				stats,
			};
		}
	},
});
