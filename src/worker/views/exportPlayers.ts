import { PHASE, PLAYER } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { validateSeasonOnly } from "../util/processInputs.ts";

export default defineView({
	id: "exportPlayers",
	processInputs: validateSeasonOnly,
	load: async ({ inputs: { season }, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			(updateEvents.has("newPhase") && g.get("phase") === PHASE.PRESEASON) ||
			season !== prevInputs?.season
		) {
			let playersAll;
			if (g.get("season") === season) {
				playersAll = await idb.cache.players.getAll();
				playersAll = playersAll.filter((p) => p.tid !== PLAYER.RETIRED); // Normally won't be in cache, but who knows...
			} else {
				playersAll = await idb.getCopies.players(
					{
						activeSeason: season,
					},
					"noCopyCache",
				);
			}

			const players = addFirstNameShort(
				await idb.getCopies.playersPlus(playersAll, {
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
