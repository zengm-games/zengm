import type { ScheduledEvent } from "./types";

const getPastFutureScheduledEvents = (
	scheduledEvent: {
		season: number;
		phase: number;
	},
	allEvents: ScheduledEvent[],
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
