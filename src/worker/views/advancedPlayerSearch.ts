import type { UpdateEvents } from "../../common/types.ts";
import type { ViewInput } from "../util/defineView.ts";

const updateAdvancedPlayerSearch = (
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
