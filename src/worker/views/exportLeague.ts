import type { UpdateEvents } from "../../common/types.ts";
import stats from "../../worker/core/player/stats.ts";

const exportLeague = (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun")) {
		return {
			stats,
		};
	}
};

export default exportLeague;
