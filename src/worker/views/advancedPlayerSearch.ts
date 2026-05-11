import type { UpdateEvents, ViewInput } from "../../common/types.ts";

const updateAdvancedPlayerSearch = async (
	{
		seasonStart,
		seasonEnd,
		singleSeason,
		playoffs,
		statType,
		filters,
		showStatTypes,
	}: ViewInput<"advancedPlayerSearch">,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun")) {
		return {
			seasonStart,
			seasonEnd,
			singleSeason,
			playoffs,
			statType,
			filters,
			showStatTypes,
		};
	}
};

export default updateAdvancedPlayerSearch;
