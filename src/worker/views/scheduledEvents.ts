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
		const scheduledEvents = await idb.getCopies.scheduledEvents(
			undefined,
			"noCopyCache",
		);

		const augmented = (
			await Promise.all(
				scheduledEvents.map(async event => {
					if (event.type === "unretirePlayer") {
						const p = await idb.getCopy.players(
							{ pid: event.info.pid },
							"noCopyCache",
						);
						if (p) {
							return {
								...event,
								info: {
									pid: event.info.pid,
									name: `${p.firstName} ${p.lastName}`,
									skills: p.ratings.at(-1)!.skills,
								},
							};
						} else {
							return [];
						}
					}

					return event;
				}),
			)
		).flat();

		return {
			scheduledEvents: augmented,
		};
	}
};

export default updateScheduledEvents;
