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
	{ abbrev, level, order, season, tid }: ViewInput<"news">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase") ||
		state.season !== season ||
		state.level !== level ||
		state.abbrev !== abbrev ||
		state.order !== order
	) {
		const events = (
			await idb.getCopies.events({
				season,
			})
		)
			.filter(event => {
				if (
					tid !== undefined &&
					event.tids &&
					event.tids.length > 0 &&
					!event.tids.includes(tid)
				) {
					return false;
				}
				return !IGNORE_EVENT_TYPES.includes(event.type);
			})
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

		if (order === "newest") {
			events.reverse();
		}

		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid"],
			seasonAttrs: ["abbrev", "region", "name"],
			season: season,
		});

		return {
			abbrev,
			events,
			level,
			order,
			season,
			teams,
			userTid: g.get("userTid"),
		};
	}
};

export default updateNews;
