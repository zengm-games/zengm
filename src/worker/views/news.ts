import { formatEventText, g } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	EventBBGM,
	LogEventType,
} from "../../common/types";
import { idb } from "../db";
import type { Face } from "facesjs";

const IGNORE_EVENT_TYPES = ["retiredList", "newTeam"];

const getTid = (event: { tids?: number[]; type: LogEventType }) => {
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

export const processEvents = async (
	eventsAll: EventBBGM[],
	{
		level = "big",
		limit = Infinity,
		tid,
	}: {
		level?: "all" | "big" | "normal";
		limit?: number;
		tid?: number;
	} = {},
) => {
	let numKept = 0;
	const events = eventsAll
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
			let keep = true;
			if (level === "big") {
				if (event.score === undefined || event.score < 20) {
					keep = false;
				}
			} else if (level === "normal") {
				if (event.score === undefined || event.score < 10) {
					keep = false;
				}
			}

			if (numKept >= limit) {
				keep = false;
			}

			if (keep) {
				numKept += 1;
			}

			return keep;
		});

	const events2 = [];
	for (const event of events) {
		events2.push({
			eid: event.eid,
			type: event.type,
			text: await formatEventText(event),
			pids: event.pids,
			tids: event.tids,
			season: event.season,
			score: event.score,
		});
	}

	const eventsWithPlayers = events2.map(event => {
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

	let numImagesRemaining = 12;
	for (const event of eventsWithPlayers) {
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

	return eventsWithPlayers;
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
		const eventsAll = await idb.getCopies.events({
			season,
		});

		if (order === "newest") {
			eventsAll.reverse();
		}

		const events = await processEvents(eventsAll, {
			level,
			tid,
		});

		const teams = (
			await idb.getCopies.teamsPlus({
				seasonAttrs: ["abbrev", "imgURL", "imgURLSmall", "region"],
				season: season,
				addDummySeason: true,
			})
		).map(t => ({
			abbrev: t.seasonAttrs.abbrev,
			imgURL: t.seasonAttrs.imgURL,
			imgURLSmall: t.seasonAttrs.imgURLSmall,
			region: t.seasonAttrs.region,
		}));

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
