import { PHASE, PLAYER, RATINGS, bySport } from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";

const updatePlayers = async (
	inputs: ViewInput<"playerRatingDists">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.season !== state.season
	) {
		let players;

		if (g.get("season") === inputs.season && g.get("phase") <= PHASE.PLAYOFFS) {
			players = await idb.cache.players.indexGetAll("playersByTid", [
				PLAYER.FREE_AGENT,
				Infinity,
			]);
		} else {
			players = await idb.getCopies.players(
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
		});

		players = await idb.getCopies.playersPlus(players, {
			ratings: ["ovr", "pot", ...extraRatings, ...RATINGS],
			season: inputs.season,
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});
		const ratingsAll = players.reduce((memo, p) => {
			for (const rating of Object.keys(p.ratings)) {
				if (rating === "ovrs" || rating === "pots") {
					for (const pos of Object.keys(p.ratings[rating])) {
						const posRating = `${rating.slice(0, rating.length - 1)}${pos}`;
						if (memo[posRating]) {
							memo[posRating].push(p.ratings[rating][pos]);
						} else {
							memo[posRating] = [p.ratings[rating][pos]];
						}
					}
					continue;
				}

				if (memo[rating]) {
					memo[rating].push(p.ratings[rating]);
				} else {
					memo[rating] = [p.ratings[rating]];
				}
			}

			return memo;
		}, {});
		return {
			season: inputs.season,
			ratingsAll,
		};
	}
};

export default updatePlayers;
