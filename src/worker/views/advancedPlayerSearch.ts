import type { UpdateEvents, ViewInput } from "../../common/types";
import { g } from "../util";

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
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
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
