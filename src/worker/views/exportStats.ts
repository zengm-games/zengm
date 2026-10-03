import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "exportStats",
	load: ({ updateEvents }) => {
		if (updateEvents.has("firstRun") || updateEvents.has("newPhase")) {
			const options = [
				{
					key: "all",
					val: "All Seasons",
				},
			];

			for (
				let season = g.get("startingSeason");
				season <= g.get("season");
				season++
			) {
				options.push({
					key: String(season),
					val: `${season} season`,
				});
			}

			return {
				seasons: options,
			};
		}
	},
});
