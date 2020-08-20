import type { UpdateEvents } from "../../common/types";
import { idb } from "../db";

const updateScheduledEvents = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("newPhase") ||
		updateEvents.includes("scheduledEvents")
	) {
		const scheduledEvents = await idb.getCopies.scheduledEvents();

		return {
			scheduledEvents,
		};
	}
};

export default updateScheduledEvents;
