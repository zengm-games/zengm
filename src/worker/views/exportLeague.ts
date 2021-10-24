import type { UpdateEvents } from "../../common/types";
import stats from "../../worker/core/player/stats";

const exportLeague = (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun")) {
		return {
			stats,
		};
	}
};

export default exportLeague;
