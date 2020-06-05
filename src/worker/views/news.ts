import { g } from "../util";
import type { UpdateEvents, ViewInput, EventBBGM } from "../../common/types";
import { idb } from "../db";

const IGNORE_EVENT_TYPES = ["retiredList"];

const getTid = (event: EventBBGM) => {
	if (!event.tids || event.tids.length === 0 || event.tids[0] < 0) {
		return;
	}

	if (event.type === "playoffs") {
		// First team is winning team
		return event.tids[0];
	}

	if (event.tids.length !== 1) {
		return;
	}

	return event.tids[0];
};

const updateNews = async (
	{ level, season }: ViewInput<"news">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
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
			.map(event => {
				if (
					event.score !== undefined &&
					event.tids &&
					event.tids.includes(g.get("userTid"))
				) {
					if (event.type === "madePlayoffs" || event.type === "draft") {
						event.score += 20;
					} else {
						event.score += 10;
					}
				}

				return event;
			})
			.filter(event => {
				if (level === "big") {
					return event.score !== undefined && event.score >= 20;
				}
				if (level === "normal") {
					return event.score !== undefined && event.score >= 10;
				}
				return true;
			})
			.map(event => ({
				...event,
				tid: getTid(event),
			}));

		events.reverse();

		return {
			events,
			level,
			season,
			userTid: g.get("userTid"),
		};
	}
};

export default updateNews;
