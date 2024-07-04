import type { ViewInput } from "../../common/types";

const updateAdvancedPlayerSearch = async ({
	seasonStart,
	seasonEnd,
	singleSeason,
	playoffs,
	statType,
	filters,
}: ViewInput<"advancedPlayerSearch">) => {
	return {
		seasonStart,
		seasonEnd,
		singleSeason,
		playoffs,
		statType,
		filters,
	};
};

export default updateAdvancedPlayerSearch;
