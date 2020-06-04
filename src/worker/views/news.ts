import { g } from "../util";
import type { UpdateEvents } from "../../common/types";
import { idb } from "../db";

const updateNews = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const events = await idb.getCopies.events({
			season: g.get("season"),
		});

		return {
			events,
		};
	}
};

export default updateNews;
