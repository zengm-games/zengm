import type { ViewInput } from "../../common/types";
import { g } from "../util";
import addFirstNameShort from "../util/addFirstNameShort";
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
	console.log(filters);

	const extraRatings: string[] = ["season"];
	for (const filter of filters) {
		if (filter.category === "rating" && !extraRatings.includes(filter.key)) {
			extraRatings.push(filter.key);
		}
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
			extraRatings,
			[],
			undefined,
			players,
		);

		for (const p of playersPlus) {
			const matchesAll = filters.every(filter => {
				if (filter.category === "rating") {
					const pValue = p.ratings[filter.key];
					if (filter.operator === ">") {
						return pValue > filter.value;
					} else if (filter.operator === "<") {
						return pValue < filter.value;
					} else if (filter.operator === ">=") {
						return pValue >= filter.value;
					} else if (filter.operator === "<=") {
						return pValue <= filter.value;
					} else if (filter.operator === "=") {
						return pValue === filter.value;
					} else if (filter.operator === "!=") {
						return pValue != filter.value;
					} else {
						throw new Error("Should never happen");
					}
				}
			});

			if (matchesAll) {
				matchedPlayers.push(p);
			}
		}
	}

	console.log(matchedPlayers);

	return {
		challengeNoRatings: g.get("challengeNoRatings"),
		seasonStart,
		seasonEnd,
		singleSeason,
		playoffs,
		statType,
		filters,
		players: addFirstNameShort(matchedPlayers),
	};
};

export default updateAdvancedPlayerSearch;
