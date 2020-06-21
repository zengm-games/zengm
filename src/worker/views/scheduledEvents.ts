import { g } from "../util";
import type { UpdateEvents } from "../../common/types";
import { idb } from "../db";

const updateScheduledEvents = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("newPhase")) {
		const scheduledEvents = await idb.league
			.transaction("scheduledEvents")
			.store.getAll();

		return {
			scheduledEvents,
		};
	}
};

export default updateScheduledEvents;
