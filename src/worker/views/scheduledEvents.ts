import type { UpdateEvents } from "../../common/types";
import { idb } from "../db";
import { g } from "../util";
import { getSortedScheduledEvents } from "../util/processScheduledEvents";

const updateScheduledEvents = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("newPhase") ||
		updateEvents.includes("scheduledEvents")
	) {
		const scheduledEvents = getSortedScheduledEvents(
			await idb.getCopies.scheduledEvents(),
		);

		return {
			confs: g.get("confs"),
			divs: g.get("divs"),
			scheduledEvents,
		};
	}
};

export default updateScheduledEvents;
