import type { ScheduledEvent } from "./types";

const getScheduleEventSortValue = (type: ScheduledEvent["type"]) => {
	switch (type) {
		case "gameAttributes":
			return 0;
		case "teamInfo":
			return 1;
		case "contraction":
			return 2;
		case "expansionDraft":
			return 3;
	}
};

export default getScheduleEventSortValue;
