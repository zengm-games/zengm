import { allStar } from "../core";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { idb } from "../db";
import { g } from "../util";
import orderBy from "lodash-es/orderBy";

const updateAllStarDunk = async (
	{ season }: ViewInput<"allStarDunk">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("allStarDunk") ||
		updateEvents.includes("watchList") ||
		season !== state.season
	) {
		const allStars = await idb.getCopy.allStars({ season });
		const dunk = allStars?.dunk;
		if (dunk === undefined) {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				errorMessage: "Dunk contest not found",
			};
			return returnValue;
		}

		const playersRaw = await idb.getCopies.players({
			pids: dunk.players.map(p => p.pid),
		});

		const players = await idb.getCopies.playersPlus(playersRaw, {
			attrs: [
				"pid",
				"name",
				"age",
				"injury",
				"watch",
				"face",
				"imgURL",
				"hgt",
				"weight",
			],
			ratings: ["ovr", "pot", "dnk", "jmp", "pos"],
			stats: ["gp", "pts", "trb", "ast", "jerseyNumber"],
			season,
			mergeStats: true,
			showNoStats: true,
		});

		const resultsByRound = dunk.rounds.map(round =>
			orderBy(allStar.dunkContest.getRoundResults(round), "index", "asc"),
		);
		console.log("resultsByRound", resultsByRound);

		return {
			dunk,
			godMode: g.get("godMode"),
			players,
			resultsByRound,
			season,
			userTid: g.get("userTid"),
		};
	}
};

export default updateAllStarDunk;
