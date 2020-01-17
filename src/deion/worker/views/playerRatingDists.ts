import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { g, overrides } from "../util";
import { UpdateEvents } from "../../common/types";

async function updatePlayers(
	inputs: {
		season: number;
	},
	updateEvents: UpdateEvents,
	state: any,
) {
	if (
		(inputs.season === g.season &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.season !== state.season
	) {
		let players;

		if (g.season === inputs.season && g.phase <= PHASE.PLAYOFFS) {
			players = await idb.cache.players.indexGetAll("playersByTid", [
				PLAYER.FREE_AGENT,
				Infinity,
			]);
		} else {
			players = await idb.getCopies.players({
				activeSeason: inputs.season,
			});
		}

		players = await idb.getCopies.playersPlus(players, {
			ratings: ["ovr", "pot", ...overrides.common.constants.RATINGS],
			season: inputs.season,
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});
		const ratingsAll = players.reduce((memo, p) => {
			for (const rating of Object.keys(p.ratings)) {
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
}

export default updatePlayers;
