import { defineView } from "../util/defineView.ts";

export default defineView(
	"advancedPlayerSearch",
	({
		inputs: {
			seasonStart,
			seasonEnd,
			singleSeason,
			playoffs,
			statType,
			filters,
			showStatTypes,
		},
		updateEvents,
	}) => {
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
	},
);
