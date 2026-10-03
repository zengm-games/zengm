import stats from "../../worker/core/player/stats.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "exportLeague",
	load: ({ updateEvents }) => {
		if (updateEvents.has("firstRun")) {
			return {
				stats,
			};
		}
	},
});
