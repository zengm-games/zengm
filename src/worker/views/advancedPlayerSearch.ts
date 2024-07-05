import type { ViewInput } from "../../common/types";
import { getPlayers } from "./playerRatings";
import { iterateActivePlayersSeasonRange } from "./rosterContinuity";

const updateAdvancedPlayerSearch = async ({
	seasonStart,
	seasonEnd,
	singleSeason,
	playoffs,
	statType,
	filters,
}: ViewInput<"advancedPlayerSearch">) => {
	if (singleSeason === "totals") {
		throw new Error("Not implemented");
	}

	const matchedPlayers = [];
	for await (const { players, season } of iterateActivePlayersSeasonRange(
		seasonStart,
		seasonEnd,
	)) {
		const playersPlus = await getPlayers(
			season,
			"all",
			[],
			["season"],
			[],
			undefined,
			players,
		);

		console.log(playersPlus);

		for (const p of playersPlus) {
			matchedPlayers.push(p);
		}
	}

	return {
		seasonStart,
		seasonEnd,
		singleSeason,
		playoffs,
		statType,
		filters,
		players: matchedPlayers,
	};
};

export default updateAdvancedPlayerSearch;
