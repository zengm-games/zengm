import { RATINGS } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { getActiveSeasonSelector } from "../db/merged/players.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { validateSeasonOnly } from "../util/processInputs.ts";
import { player } from "../core/index.ts";

export default defineView({
	id: "playerRatingDists",
	processInputs: validateSeasonOnly,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			(inputs.season === g.get("season") &&
				(updateEvents.has("gameSim") || updateEvents.has("playerMovement"))) ||
			inputs.season !== prevInputs?.season
		) {
			const playersRaw = await idb.merged.players.getAll(
				getActiveSeasonSelector(inputs.season),
			);

			const extraRatings = bySport({
				baseball: ["ovrs", "pots"],
				basketball: [],
				football: ["ovrs", "pots"],
				hockey: ["ovrs", "pots"],
			} as const);

			const players = await player.formatAll(playersRaw, {
				ratings: ["ovr", "pot", ...extraRatings, ...RATINGS],
				season: inputs.season,
				showNoStats: true,
				showRookies: true,
				fuzz: true,
			});

			// Only numeric values can be plotted. Insertion order determines the display order in the UI
			const ratingsAll: Record<string, number[]> = {};
			const addValue = (rating: string, value: unknown) => {
				if (typeof value !== "number") {
					return;
				}
				ratingsAll[rating] ??= [];
				ratingsAll[rating].push(value);
			};

			for (const p of players) {
				for (const [rating, value] of Object.entries(p.ratings)) {
					if (rating === "ovrs" || rating === "pots") {
						// Split into one rating per position, like ovrQB
						if (typeof value === "object") {
							for (const [pos, posValue] of Object.entries(value)) {
								addValue(`${rating.slice(0, -1)}${pos}`, posValue);
							}
						}
						continue;
					}

					addValue(rating, value);
				}
			}

			return {
				season: inputs.season,
				ratingsAll,
			};
		}
	},
});
