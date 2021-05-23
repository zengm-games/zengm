import orderBy from "lodash-es/orderBy";
import { helpers } from "../../util";
import type {
	ScheduledEventWithoutKey,
	Team,
	TeamSeasonWithoutKey,
} from "../../../common/types";
import { gameAttributeHasHistory, PHASE } from "../../../common";
import { ALWAYS_WRAP } from "../league/loadGameAttributes";
import { wrap } from "../../util/g";

const processGameAttributes = (
	events: any[],
	season: number,
	phase: number,
	gameAttributesHistory?: boolean,
) => {
	let gameAttributeEvents = [];

	for (const event of events) {
		if (event.type === "gameAttributes") {
			gameAttributeEvents.push(event);
		}
	}

	let initialGameAttributes;

	// Fine what the gameAttributes state was at the beginning of the given season/phase
	const prevState: any = {};
	for (const event of gameAttributeEvents) {
		if (
			(event.season === season + 1 ||
				(event.season === season && event.phase > phase)) &&
			initialGameAttributes === undefined
		) {
			initialGameAttributes = helpers.deepCopy(prevState);
			break;
		}

		for (const [key, value] of Object.entries(event.info)) {
			if (
				!gameAttributesHistory ||
				!prevState.hasOwnProperty(key) ||
				!ALWAYS_WRAP.includes(key)
			) {
				prevState[key] = value;
			} else {
				if (!gameAttributeHasHistory(prevState[key])) {
					prevState[key] = [
						{
							start: -Infinity,
							value: prevState[key],
						},
					];
				}

				prevState[key] = wrap(prevState, key as any, value, {
					season: event.season,
					phase: event.phase,
				});
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

const fixTeam = (
	mergedTeam: {
		disabled?: boolean;
		imgURL?: string;
		imgURLSmall?: string;
	},
	newTeam: {
		imgURL?: string;
		imgURLSmall?: string;
	},
) => {
	if (mergedTeam.disabled) {
		delete mergedTeam.disabled;
	}

	// If imgURL is defined in scheduled event but imgURLSmall is not, delete old imgURLSmall. Otherwise LAC wind up having a the Wings logo in imgURLSmall!
	const deleteImgURLSmall =
		newTeam.imgURL && !newTeam.imgURLSmall && mergedTeam.imgURLSmall;
	if (deleteImgURLSmall) {
		delete mergedTeam.imgURLSmall;
	}
};

const processTeams = (
	events: ScheduledEventWithoutKey[],
	season: number,
	phase: number,
	keepAllTeams: boolean,
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
		imgURLSmall?: string;
		srID: string;
		tid: number;
		cid: number;
		did: number;
		disabled?: boolean;
		firstSeasonAfterExpansion?: number;
		seasons?: TeamSeasonWithoutKey[];
		retiredJerseyNumbers?: Team["retiredJerseyNumbers"];
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
			for (const t of event.info.teams) {
				const ind = prevState.findIndex(t0 => t0.tid === t.tid);
				const t0 = prevState[ind];
				if (t0) {
					// Re-expanding a contracted team, probably with keepAllTeams
					prevState[ind] = {
						...t0,
						...t,
					};
					fixTeam(prevState[ind], t);
				} else {
					prevState.push({
						...t,
					});
				}
			}
		} else if (event.type === "teamInfo") {
			const t = event.info;
			const ind = prevState.findIndex(t0 => t0.tid === t.tid);
			const t0 = prevState[ind];
			if (!t0) {
				throw new Error(`teamInfo before expansionDraft for tid ${t.tid}`);
			}
			prevState[ind] = {
				...t0,
				...t,
			};
			fixTeam(prevState[ind], t);
		} else if (event.type === "contraction") {
			if ((event.season === season && event.phase <= phase) || keepAllTeams) {
				// Special case - we need to keep this team around, but label it as disabled. Otherwise, we can't generate the playoff bracket in leagues starting in a phase after the playoffs. Also, for realStats=="all".
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

			const event2 = {
				...event,
				info: {
					...event.info,
					tid: newTid,
				},
			};

			// Delete cid from these events, because I was too lazy to refactor team creation to not need cid in initialTeams, so cid is still in the real team data
			if (event2.type === "teamInfo") {
				delete (event2.info as any).cid;
			}

			return event2;
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
	{
		gameAttributesHistory,
		keepAllTeams,
		onlyTeams,
		season,
		phase = PHASE.PRESEASON,
	}: {
		gameAttributesHistory?: boolean;
		keepAllTeams: boolean;
		onlyTeams?: boolean;
		season: number;
		phase?: number;
	},
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

	const { teamEvents, initialTeams } = processTeams(
		eventsSorted,
		season,
		phase,
		keepAllTeams,
	);

	if (onlyTeams) {
		return {
			scheduledEvents: [],
			initialGameAttributes: {},
			initialTeams,
		};
	}

	const { gameAttributeEvents, initialGameAttributes } = processGameAttributes(
		eventsSorted,
		season,
		phase,
		gameAttributesHistory,
	);

	return {
		scheduledEvents: [...gameAttributeEvents, ...teamEvents],
		initialGameAttributes,
		initialTeams,
	};
};

export default formatScheduledEvents;
