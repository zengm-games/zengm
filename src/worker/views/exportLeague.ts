import stats from "../../worker/core/player/stats.ts";
import { defineView } from "../util/defineView.ts";

export default defineView("exportLeague", ({ updateEvents }) => {
	if (updateEvents.includes("firstRun")) {
		return {
			stats,
		};
	}
});
