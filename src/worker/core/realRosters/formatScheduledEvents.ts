import { helpers } from "../../util/index.ts";
import type {
	Div,
	ScheduledEventWithoutKey,
	Team,
	TeamSeasonWithoutKey,
} from "../../../common/types.ts";
import { PHASE } from "../../../common/constants.ts";
import { ALWAYS_WRAP } from "../league/loadGameAttributes.ts";
import { wrapNewValueIfCurrentlyWrapped } from "../../util/g.ts";
import { orderBy } from "../../../common/utils.ts";
import { gameAttributeHasHistory } from "../../../common/gameAttributeHasHistory.ts";

const processGameAttributes = (
	events: any[],
	season: number,
	phase: number,
	gameAttributesHistory?: boolean,
) => {
	let gameAttributeEvents = [];

	for (const event of events) {
		if (
			event.type === "gameAttributes" ||
			event.type === "awards" ||
			event.type === "confsDivs"
		) {
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
			if (event.type === "confsDivs" && key === "teams") {
				// Handled in processTeams
				continue;
			}

			if (
				!gameAttributesHistory ||
				!Object.hasOwn(prevState, key) ||
				!ALWAYS_WRAP.includes(key as any)
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

				prevState[key] = wrapNewValueIfCurrentlyWrapped(
					prevState,
					key as any,
					value,
					{
						season: event.season,
						phase: event.phase,
					},
				);
			}
		}
	}

	// Handle initialGameAttributes for the last season, where the season + 1 condition above can never be met
	if (initialGameAttributes === undefined) {
		initialGameAttributes = helpers.deepCopy(prevState);
	}

	gameAttributeEvents = helpers.deepCopy(
		gameAttributeEvents.filter(
			(event) =>
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

	// confsDivs events are here only to find the divisions of the initial teams. For the future ones, see applyTidOverridesToConfsDivs.
	const teamAndConfsDivsEvents = [];

	for (const event of events) {
		if (
			event.type === "expansionDraft" ||
			event.type === "teamInfo" ||
			event.type === "contraction"
		) {
			teamEvents.push(event);
			teamAndConfsDivsEvents.push(event);
		} else if (event.type === "confsDivs") {
			teamAndConfsDivsEvents.push(event);
		}
	}

	// A confsDivs event can include teams from an expansion draft in the same phase, so it needs to come after
	const teamAndConfsDivsEventsSorted = orderBy(teamAndConfsDivsEvents, [
		"season",
		"phase",
		(event) => (event.type === "confsDivs" ? 1 : 0),
	]);

	let initialTeams:
		| {
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
		  }[]
		| undefined;

	// Team events have did but not cid, so cid comes from the divisions at that time
	let divs: Div[] | undefined;
	const setCid = (t: { cid?: number; did?: number }) => {
		const div = divs?.find((div) => div.did === t.did);
		if (div) {
			t.cid = div.cid;
		}
	};

	// Keep track of initial teams
	let prevState: any[] = [];
	for (const event of teamAndConfsDivsEventsSorted) {
		if (
			(event.season > season ||
				(event.season === season && event.phase > phase)) &&
			initialTeams === undefined
		) {
			initialTeams = helpers.deepCopy(prevState);
		}

		if (event.type === "confsDivs") {
			divs = event.info.divs;
			for (const { tid, did } of event.info.teams) {
				const t = prevState.find((t) => t.tid === tid);
				if (t) {
					t.did = did;
				}
			}

			// All teams, because the conference of a division could have changed
			for (const t of prevState) {
				setCid(t);
			}
			continue;
		}

		if (event.type === "expansionDraft") {
			for (const t of event.info.teams) {
				const ind = prevState.findIndex((t0) => t0.tid === t.tid);
				const t0 = prevState[ind];
				if (t0) {
					// Re-expanding a contracted team, probably with keepAllTeams
					prevState[ind] = {
						...t0,
						...t,
					};
					fixTeam(prevState[ind], t);
					setCid(prevState[ind]);
				} else {
					// The type says did is a string, but it is a number in the real team data
					const t2: any = {
						...t,
					};
					setCid(t2);
					prevState.push(t2);
				}
			}
		} else if (event.type === "teamInfo") {
			const t = event.info;
			const ind = prevState.findIndex((t0) => t0.tid === t.tid);
			const t0 = prevState[ind];
			if (!t0) {
				throw new Error(`teamInfo before expansionDraft for tid ${t.tid}`);
			}
			prevState[ind] = {
				...t0,
				...t,
			};
			fixTeam(prevState[ind], t);
			setCid(prevState[ind]);
		} else if (event.type === "contraction") {
			if ((event.season === season && event.phase <= phase) || keepAllTeams) {
				// Special case - we need to keep this team around, but label it as disabled. Otherwise, we can't generate the playoff bracket in leagues starting in a phase after the playoffs. Also, for realStats=="all".
				const t = prevState.find((t) => t.tid === event.info.tid);
				t.disabled = true;
			} else {
				let found = false;
				prevState = prevState.filter((t) => {
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
	if (initialTeams === undefined) {
		initialTeams = helpers.deepCopy(prevState);
	}

	teamEvents = helpers.deepCopy(
		teamEvents.filter(
			(event) =>
				event.season > season || (event.season === season && event.phase > 0),
		),
	);

	// Rewrite tids, to remove gaps in initialTeams caused by contractions prior to `season`
	const tidOverrides: Record<number, number> = {};
	for (const [tid, t] of initialTeams.entries()) {
		if (t.tid === tid) {
			tidOverrides[t.tid] = tid;
			continue;
		}

		tidOverrides[t.tid] = tid;
		t.tid = tid;
	}
	let maxSeenTid = Math.max(...Object.values(tidOverrides));
	teamEvents = teamEvents.map((event) => {
		if (event.type === "teamInfo" || event.type === "contraction") {
			const oldTid = event.info.tid;
			let newTid = tidOverrides[oldTid];
			if (newTid === undefined) {
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
					teams: event.info.teams.map((t) => {
						if (t.tid === undefined) {
							return t;
						}

						const oldTid = t.tid;
						let newTid = tidOverrides[oldTid];
						if (newTid === undefined) {
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

	return { teamEvents, initialTeams, tidOverrides };
};

// Same tid changes as processTeams does to the other types of events. A team with no new tid was removed before the league starts and never comes back.
const applyTidOverridesToConfsDivs = (
	events: any[],
	tidOverrides: Record<number, number>,
): any[] => {
	return events.map((event) => {
		if (event.type !== "confsDivs") {
			return event;
		}

		const teams = [];
		for (const t of event.info.teams) {
			const tid = tidOverrides[t.tid];
			if (tid !== undefined) {
				teams.push({
					...t,
					tid,
				});
			}
		}

		return {
			...event,
			info: {
				...event.info,
				teams,
			},
		};
	});
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
			event.type !== "contraction" &&
			event.type !== "awards" &&
			event.type !== "confsDivs"
		) {
			throw new Error(`Unknown event type: ${event.type}`);
		}
	}

	const eventsSorted = orderBy(events, ["season", "phase", "type"]);

	const { teamEvents, initialTeams, tidOverrides } = processTeams(
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
		scheduledEvents: [
			...applyTidOverridesToConfsDivs(gameAttributeEvents, tidOverrides),
			...teamEvents,
		],
		initialGameAttributes,
		initialTeams,
	};
};

export default formatScheduledEvents;
