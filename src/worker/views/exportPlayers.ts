import { PHASE } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { validateSeasonOnly } from "../util/processInputs.ts";
import { player } from "../core/index.ts";

export default defineView({
	id: "exportPlayers",
	processInputs: validateSeasonOnly,
	load: async ({ inputs: { season }, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			(updateEvents.has("newPhase") && g.get("phase") === PHASE.PRESEASON) ||
			season !== prevInputs?.season
		) {
			const playersAll = await idb.merged.players.getAll(
				g.get("season") === season
					? { nonRetired: true }
					: { activeSeason: season },
			);

			const players = addFirstNameShort(
				await player.formatAll(playersAll, {
					attrs: [
						"pid",
						"firstName",
						"lastName",
						"age",
						"injury",
						"watch",
						"tid",
						"abbrev",
						"jerseyNumber",
					],
					ratings: ["ovr", "pot", "skills", "pos"],
					season,
					showNoStats: true,
					showRookies: true,
					fuzz: true,
				}),
			);

			return {
				players,
				season,
			};
		}
	},
});
