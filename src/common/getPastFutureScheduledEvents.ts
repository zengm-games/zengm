import getScheduleEventSortValue from "./getScheduleEventSortValue";
import type { ScheduledEvent } from "./types";

const getPastFutureScheduledEvents = (
	scheduledEvent: {
		season: number;
		phase: number;
		type: ScheduledEvent["type"];
	},
	allEvents: ScheduledEvent[],
	ties: "future" | "past",
) => {
	const pastEvents = [];
	const futureEvents = [];
	for (const otherEvent of allEvents) {
		if (
			otherEvent.season > scheduledEvent.season ||
			(otherEvent.season === scheduledEvent.season &&
				otherEvent.phase > scheduledEvent.phase)
		) {
			futureEvents.push(otherEvent);
		} else if (
			otherEvent.season === scheduledEvent.season &&
			otherEvent.phase === scheduledEvent.phase
		) {
			if (otherEvent.type === scheduledEvent.type) {
				if (ties === "future") {
					futureEvents.push(otherEvent);
				} else {
					pastEvents.push(otherEvent);
				}
			} else if (
				getScheduleEventSortValue(otherEvent.type) <
				getScheduleEventSortValue(scheduledEvent.type)
			) {
				pastEvents.push(otherEvent);
			} else {
				futureEvents.push(otherEvent);
			}
		} else {
			pastEvents.push(otherEvent);
		}
	}

	return {
		pastEvents,
		futureEvents,
	};
};

export default getPastFutureScheduledEvents;
