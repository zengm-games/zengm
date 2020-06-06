import { g } from "../util";
import type { UpdateEvents, ViewInput, EventBBGM } from "../../common/types";
import { idb } from "../db";
import type { Face } from "facesjs";

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
			.map(event => {
				let p:
					| undefined
					| {
							imgURL?: string;
							face?: Face;
					  };
				return {
					...event,
					tid: getTid(event),
					p,
				};
			});

		if (order === "newest") {
			events.reverse();
		}

		let numImagesRemaining = 12;
		for (const event of events) {
			if (numImagesRemaining <= 0) {
				break;
			}
			if (event.pids && event.pids.length > 0) {
				const player = await idb.getCopy.players({ pid: event.pids[0] });
				if (player) {
					event.p = {
						imgURL: player.imgURL,
						face: player.imgURL ? undefined : player.face,
					};
					numImagesRemaining -= 1;
				}
			}
		}

		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid"],
			seasonAttrs: ["abbrev", "imgURL", "name"],
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
