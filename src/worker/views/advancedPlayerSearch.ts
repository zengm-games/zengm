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
			let match = true;
			for (const filter of filters) {
				if (filter.category === "rating") {
					const pValue = p.ratings[filter.key];
					if (filter.operator === ">") {
						if (pValue <= filter.value) {
							match = false;
						}
					} else if (filter.operator === "<") {
						if (pValue >= filter.value) {
							match = false;
						}
					} else if (filter.operator === ">=") {
						if (pValue < filter.value) {
							match = false;
						}
					} else if (filter.operator === "<=") {
						if (pValue > filter.value) {
							match = false;
						}
					} else if (filter.operator === "=") {
						if (pValue != filter.value) {
							match = false;
						}
					} else if (filter.operator === "!=") {
						if (pValue === filter.value) {
							match = false;
						}
					} else {
						throw new Error("Should never happen");
					}
				}

				if (!match) {
					break;
				}
			}

			if (match) {
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
