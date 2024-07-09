import { allFilters } from "../../common/advancedPlayerSearch";
import type { ViewInput } from "../../common/types";
import { normalizeIntl } from "../../ui/components/DataTable/normalizeIntl";
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

	const extraAttrs: string[] = [];
	const extraRatings: string[] = ["season"];
	for (const filter of filters) {
		if (filter.category === "rating" && !extraRatings.includes(filter.key)) {
			extraRatings.push(filter.key);
		} else if (filter.category === "bio") {
			const filterInfo = allFilters[filter.category].options[filter.key];
			if (filterInfo) {
				const key = filterInfo.workerFieldOverride ?? filter.key;
				if (!extraAttrs.includes(key)) {
					extraAttrs.push(key);
				}
			}
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
			extraAttrs,
			extraRatings,
			[],
			undefined,
			players,
		);

		for (const p of playersPlus) {
			const matchesAll = filters.every(filter => {
				const filterInfo = allFilters[filter.category].options[filter.key];
				if (!filterInfo) {
					return true;
				}

				const pValue = filterInfo.getValue(p);
				if (filterInfo.valueType === "numeric") {
					const pValueNumber = pValue as number;
					if (filter.operator === ">") {
						return pValueNumber > filter.value;
					} else if (filter.operator === "<") {
						return pValueNumber < filter.value;
					} else if (filter.operator === ">=") {
						return pValueNumber >= filter.value;
					} else if (filter.operator === "<=") {
						return pValueNumber <= filter.value;
					} else if (filter.operator === "=") {
						return pValueNumber === filter.value;
					} else if (filter.operator === "!=") {
						return pValueNumber != filter.value;
					} else {
						throw new Error("Should never happen");
					}
				} else if (filterInfo.valueType === "string") {
					const searchText = normalizeIntl(filter.value as string);
					const includes = normalizeIntl(pValue as string).includes(searchText);
					return filter.operator === "contains" ? includes : !includes;
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
