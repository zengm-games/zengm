import orderBy from "lodash/orderBy";
import { helpers } from "../../util";
import type { ScheduledEventWithoutKey } from "../../../common/types";
import { PHASE } from "../../../common";

const processGameAttributes = (
	events: any[],
	season: number,
	phase: number,
) => {
	let gameAttributeEvents = [];

	for (const event of events) {
		if (event.type === "gameAttributes") {
			gameAttributeEvents.push(event);
		}
	}

	let initialGameAttributes;

	// Remove gameAttributes individual property dupes, and find what the gameAttributes state was at the beginning of the given season
	const prevState: any = {};
	for (const event of gameAttributeEvents) {
		if (
			(event.season === season + 1 ||
				(event.season === season && event.phase > phase)) &&
			initialGameAttributes === undefined
		) {
			initialGameAttributes = helpers.deepCopy(prevState);
		}
		for (const [key, value] of Object.entries(event.info)) {
			if (value === prevState[key]) {
				delete event.info[key];
			} else {
				prevState[key] = value;
			}
		}
	}

	// Handle initialGameAttributes for the last season, where the season + 1 condition above can never be met
	if (initialGameAttributes === undefined) {
		initialGameAttributes = helpers.deepCopy(prevState);
	}

	gameAttributeEvents = helpers.deepCopy(
		gameAttributeEvents.filter(
			event =>
				(event.season > season ||
					(event.season === season && event.phase > phase)) &&
				Object.keys(event.info).length > 0,
		),
	);

	return { gameAttributeEvents, initialGameAttributes };
};

const processTeams = (
	events: ScheduledEventWithoutKey[],
	season: number,
	phase: number,
) => {
	let teamEvents = [];

	for (const event of events) {
		if (
			event.type === "expansionDraft" ||
			event.type === "teamInfo" ||
			event.type === "contraction"
		) {
			teamEvents.push(event);
		}
	}

	let initialTeams: {
		region: string;
		name: string;
		pop: number;
		colors: [string, string, string];
		abbrev: string;
		imgURL: string;
		srID: string;
		tid: number;
		cid: number;
		did: number;
		disabled?: boolean;
	}[];

	// Keep track of initial teams
	let prevState: any[] = [];
	for (const event of teamEvents) {
		if (
			(event.season > season ||
				(event.season === season && event.phase > phase)) &&
			// @ts-ignore
			initialTeams === undefined
		) {
			initialTeams = helpers.deepCopy(prevState);
		}

		if (event.type === "expansionDraft") {
			prevState.push(...event.info.teams);
		} else if (event.type === "teamInfo") {
			const t = event.info;
			const ind = prevState.findIndex(t0 => t0.tid === t.tid);
			const t0 = prevState[ind];
			if (!t0) {
				console.log(event);
				throw new Error(`teamInfo before expansionDraft for tid ${t.tid}`);
			}
			prevState[ind] = {
				...t0,
				...t,
			};
		} else if (event.type === "contraction") {
			if (event.season === season && event.phase <= phase) {
				// Special case - we need to keep this team around, but label it as disabled. Otherwise, we can't generate the playoff bracket in leagues starting in a phase after the playoffs.
				const t = prevState.find(t => t.tid === event.info.tid);
				t.disabled = true;
			} else {
				let found = false;
				prevState = prevState.filter(t => {
					if (t.tid === event.info.tid) {
						found = true;
						return false;
					}
					return true;
				});
				if (!found) {
					console.log(event);
					throw new Error(
						`Contraction of team that doesn't exist, tid ${event.info.tid}`,
					);
				}
			}
		}
	}

	// Handle initialTeams for the last season, where the season + 1 condition above can never be met
	// @ts-ignore
	if (initialTeams === undefined) {
		initialTeams = helpers.deepCopy(prevState);
	}

	teamEvents = helpers.deepCopy(
		teamEvents.filter(
			event =>
				event.season > season || (event.season === season && event.phase > 0),
		),
	);

	// Rewrite tids, to remove gaps in initialTeams caused by contractions prior to `season`
	const tidOverrides: Record<number, number> = {};
	for (let tid = 0; tid < initialTeams.length; tid++) {
		const t = initialTeams[tid];
		if (t.tid === tid) {
			tidOverrides[t.tid] = tid;
			continue;
		}

		tidOverrides[t.tid] = tid;
		t.tid = tid;
	}
	let maxSeenTid = Math.max(...Object.values(tidOverrides));
	teamEvents = teamEvents.map(event => {
		if (event.type === "teamInfo" || event.type === "contraction") {
			const oldTid = event.info.tid;
			let newTid = tidOverrides[oldTid];
			if (newTid == undefined) {
				newTid = maxSeenTid + 1;
				tidOverrides[oldTid] = newTid;
			}
			if (newTid > maxSeenTid) {
				maxSeenTid = newTid;
			}

			return {
				...event,
				info: {
					...event.info,
					tid: newTid,
				},
			};
		} else if (event.type === "expansionDraft") {
			return {
				...event,
				info: {
					...event.info,
					teams: event.info.teams.map(t => {
						if (t.tid === undefined) {
							return t;
						}

						const oldTid = t.tid;
						let newTid = tidOverrides[oldTid];
						if (newTid == undefined) {
							newTid = maxSeenTid + 1;
							tidOverrides[oldTid] = newTid;
						}
						if (newTid > maxSeenTid) {
							maxSeenTid = newTid;
						}

						return {
							...t,
							tid: newTid,
						};
					}),
				},
			};
		}

		return event;
	});

	return { teamEvents, initialTeams };
};

const formatScheduledEvents = (
	events: any[],
	season: number,
	phase: number = PHASE.PRESEASON,
) => {
	for (const event of events) {
		if (
			event.type !== "gameAttributes" &&
			event.type !== "expansionDraft" &&
			event.type !== "teamInfo" &&
			event.type !== "contraction"
		) {
			throw new Error(`Unknown event type: ${event.type}`);
		}
	}

	const eventsSorted = orderBy(events, ["season", "phase", "type"]);

	const { gameAttributeEvents, initialGameAttributes } = processGameAttributes(
		eventsSorted,
		season,
		phase,
	);

	const { teamEvents, initialTeams } = processTeams(
		eventsSorted,
		season,
		phase,
	);

	return {
		scheduledEvents: [...gameAttributeEvents, ...teamEvents],
		initialGameAttributes,
		initialTeams,
	};
};

export default formatScheduledEvents;
