import { PHASE, PLAYER, RATINGS } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { validateSeasonOnly } from "../util/processInputs.ts";

export default defineView({
	id: "playerRatingDists",
	processInputs: validateSeasonOnly,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.includes("firstRun") ||
			(inputs.season === g.get("season") &&
				(updateEvents.includes("gameSim") ||
					updateEvents.includes("playerMovement"))) ||
			inputs.season !== prevInputs?.season
		) {
			let playersRaw;

			if (
				g.get("season") === inputs.season &&
				g.get("phase") <= PHASE.PLAYOFFS
			) {
				playersRaw = await idb.cache.players.indexGetAll("playersByTid", [
					PLAYER.FREE_AGENT,
					Infinity,
				]);
			} else {
				playersRaw = await idb.getCopies.players(
					{
						activeSeason: inputs.season,
					},
					"noCopyCache",
				);
			}

			const extraRatings = bySport({
				baseball: ["ovrs", "pots"],
				basketball: [],
				football: ["ovrs", "pots"],
				hockey: ["ovrs", "pots"],
			} as const);

			const players = await idb.getCopies.playersPlus(playersRaw, {
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
