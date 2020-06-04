import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { idb } from "../db";

const IGNORE_EVENT_TYPES = ["retiredList"];

const updateNews = async (
	{ level, season }: ViewInput<"news">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase") ||
		state.season !== season ||
		state.level !== level
	) {
		const events = (
			await idb.getCopies.events({
				season,
			})
		)
			.filter(event => !IGNORE_EVENT_TYPES.includes(event.type))
			.filter(event => {
				if (level === "big") {
					return event.score !== undefined && event.score >= 20;
				}
				if (level === "normal") {
					return event.score !== undefined && event.score >= 10;
				}
				return true;
			});

		events.reverse();

		return {
			events,
			level,
			season,
		};
	}
};

export default updateNews;
