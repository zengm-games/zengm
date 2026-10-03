import { PHASE, PLAYER } from "../../common/constants.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { getPlayers } from "./playerRatings.ts";
import { player } from "../core/index.ts";
import { idb } from "../db/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { processInputs } from "./playerRatings.ts";

export default defineView({
	id: "playerBios",
	processInputs,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.includes("firstRun") ||
			(inputs.season === g.get("season") &&
				(updateEvents.includes("gameSim") ||
					updateEvents.includes("playerMovement"))) ||
			(updateEvents.includes("newPhase") &&
				g.get("phase") === PHASE.PRESEASON) ||
			inputs.season !== prevInputs?.season ||
			inputs.abbrev !== prevInputs?.abbrev
		) {
			const stats = bySport({
				baseball: ["keyStats"],
				basketball: ["pts", "trb", "ast"],
				football: ["keyStats"],
				hockey: ["keyStats"],
			} as const);

			const playersWithoutMood = addFirstNameShort(
				await getPlayers(
					inputs.season,
					inputs.abbrev,
					// name is for the mood popover
					["born", "college", "hgt", "weight", "draft", "experience", "name"],
					["ovr", "pot"],
					[...stats, "jerseyNumber"],
					inputs.tid,
				),
			);

			// No mood for retired players
			const players = [];
			for (const p of playersWithoutMood) {
				const p2 =
					p.tid !== PLAYER.RETIRED
						? await idb.cache.players.get(p.pid)
						: undefined;
				if (p2) {
					players.push({ ...p, mood: await player.moodInfos(p2) });
				} else {
					players.push(p);
				}
			}

			return {
				abbrev: inputs.abbrev,
				season: inputs.season,
				players,
				stats,
			};
		}
	},
});
