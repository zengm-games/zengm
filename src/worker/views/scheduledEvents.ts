import type { UpdateEvents } from "../../common/types.ts";
import { last } from "../../common/utils.ts";
import { idb } from "../db/index.ts";

const updateScheduledEvents = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("newPhase") ||
		updateEvents.includes("scheduledEvents")
	) {
		const scheduledEvents = await idb.getCopies.scheduledEvents(
			undefined,
			"noCopyCache",
		);

		const augmented = [];
		for (const event of scheduledEvents) {
			if (event.type === "unretirePlayer") {
				const p = await idb.getCopy.players(
					{ pid: event.info.pid },
					"noCopyCache",
				);
				if (p) {
					augmented.push({
						...event,
						info: {
							pid: event.info.pid,
							name: `${p.firstName} ${p.lastName}`,
							skills: last(p.ratings).skills,
						},
					});
				}
			} else {
				augmented.push(event);
			}
		}

		return {
			scheduledEvents: augmented,
		};
	}
};

export default updateScheduledEvents;
