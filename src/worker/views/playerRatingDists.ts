import { PHASE, PLAYER, RATINGS, bySport } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

const updatePlayers = async (
	inputs: ViewInput<"playerRatingDists">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
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
						if (memo.hasOwnProperty(posRating)) {
							memo[posRating].push(p.ratings[rating][pos]);
						} else {
							memo[posRating] = [p.ratings[rating][pos]];
						}
					}
					continue;
				}

				if (memo.hasOwnProperty(rating)) {
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
