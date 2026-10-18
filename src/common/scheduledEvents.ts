import { PHASE } from "./constants.ts";
import type {
	GameAttributesLeague,
	Phase,
	ScheduledEvent,
	ScheduledEventWithoutKey,
} from "./types.ts";
import { orderBy } from "./utils.ts";

type SeasonPhase = {
	season: number;
	phase: number;
};

// Scheduled events are only processed after switching to one of these phases
const SCHEDULED_EVENT_PHASES = [
	PHASE.PRESEASON,
	PHASE.DRAFT_LOTTERY,
	PHASE.FREE_AGENCY,
] satisfies Phase[];

// An expansion draft can only happen in these phases
const SCHEDULED_EVENT_PHASES_EXPANSION_DRAFT = [
	PHASE.PRESEASON,
	PHASE.DRAFT_LOTTERY,
] satisfies Phase[];

export const getScheduledEventPhases = (type: ScheduledEvent["type"]) => {
	return type === "expansionDraft"
		? SCHEDULED_EVENT_PHASES_EXPANSION_DRAFT
		: SCHEDULED_EVENT_PHASES;
};

// Is `a` after `b`?
const isAfter = (a: SeasonPhase, b: SeasonPhase) => {
	return a.season > b.season || (a.season === b.season && a.phase > b.phase);
};

// Events in the past (or the current phase) have already been processed, or they never will be
export const isFutureScheduledEvent = (
	event: SeasonPhase,
	current: SeasonPhase,
) => {
	return isAfter(event, current);
};

// When running the expansionDraft event, it calls newPhase again which calls other scheduled events and other things. So this should be the last scheduled event of this season/phase, so any prior ones happen before all that other stuff. Previously this was causing bugs in auto play, where unretirePlayer for forceHistoricalRosters was being called after expansionDraft and then those players would not be unretired in time.
const getTypeSortValue = (type: ScheduledEvent["type"]) => {
	return type === "expansionDraft" ? 1 : 0;
};

// A confsDivs event lists the division of every team that is active after all the other events in the same season/phase, including teams from an expansion draft, and not including contracted teams. So when keeping track of teams, it comes after all those other events. It is not actually processed last (see getTypeSortValue for why that has to be the expansion draft), so processScheduledEvents applies it to the expansion teams, and ignores the division in a teamInfo event for a team that is in a confsDivs event.
const getTeamsTypeSortValue = (type: ScheduledEvent["type"]) => {
	return type === "confsDivs" ? 2 : getTypeSortValue(type);
};

// Events that are not saved yet have no id, and they will get a higher id than any existing event when they are saved
const compareIds = (a: number | undefined, b: number | undefined) => {
	if (a === b) {
		return 0;
	}
	if (a === undefined) {
		return 1;
	}
	if (b === undefined) {
		return -1;
	}
	return a - b;
};

// Enough of an event to know where it is sorted, for an event that is still being edited
type SortableEvent = Pick<
	ScheduledEventWithoutKey,
	"season" | "phase" | "type" | "id"
>;

// Returns a function that is negative if `a` is before `b`, and positive if `a` is after `b`
const makeCompare = (
	typeSortValue: (type: ScheduledEvent["type"]) => number,
) => {
	return (a: SortableEvent, b: SortableEvent) => {
		return (
			a.season - b.season ||
			a.phase - b.phase ||
			typeSortValue(a.type) - typeSortValue(b.type) ||
			compareIds(a.id, b.id)
		);
	};
};

// This is the order that scheduled events are processed in
const compareScheduledEvents = makeCompare(getTypeSortValue);

// Same, except for where confsDivs events are. This is for keeping track of teams, see getTeamsTypeSortValue.
const compareScheduledEventsForTeams = makeCompare(getTeamsTypeSortValue);

export const sortScheduledEvents = <T extends ScheduledEventWithoutKey>(
	events: T[],
) => {
	return events.toSorted(compareScheduledEvents);
};

// Team info that can be changed by scheduled events. Types are loose because expansionDraft events store some numbers as strings, and teamInfo events don't
type TeamFields = {
	abbrev?: string;
	colors?: [string, string, string];
	did?: number | string;
	imgURL?: string;
	imgURLSmall?: string;
	jersey?: string;
	name?: string;
	pop?: number | string;
	region?: string;
	stadiumCapacity?: number | string;
};

const TEAM_FIELDS = [
	"abbrev",
	"colors",
	"did",
	"imgURL",
	"imgURLSmall",
	"jersey",
	"name",
	"pop",
	"region",
	"stadiumCapacity",
] as const satisfies (keyof TeamFields)[];

type ScheduledEventsCurrentTeam = TeamFields & {
	tid: number;
	disabled?: boolean;
};

export type ScheduledEventsTeam = TeamFields & {
	tid: number;
	active: boolean;

	// True for a team that does not exist in the league yet, it's only created by a scheduled expansion draft
	future: boolean;
};

export type ScheduledEventsChange<T extends ScheduledEventWithoutKey> = {
	// The original event, before any changes
	event: T;
} & (
	| {
			type: "delete";

			// teamDoesNotExist and teamNotActive are for contraction and teamInfo events. teamsAlreadyActive is for expansionDraft events.
			reason: "teamDoesNotExist" | "teamNotActive" | "teamsAlreadyActive";
	  }
	| {
			// Some (but not all) of the teams in an expansion draft are removed, because they will already be active
			type: "removeExpansionTeams";
			teams: {
				region: string;
				name: string;
			}[];
	  }
);

const copyTeamFields = (from: TeamFields, to: TeamFields) => {
	for (const key of TEAM_FIELDS) {
		if (from[key] !== undefined) {
			(to as any)[key] = from[key];
		}
	}
};

/**
 * Scheduled events refer to teams by tid, including teams that do not exist yet because they will be created by a scheduled expansion draft. A new team always gets the next available tid at the time it is created, so the tid of a future team depends on how many other teams are created before it. That means adding, editing, or deleting one event can invalidate other events, such as:
 *
 * - Deleting an expansion draft changes the tid of every team created after it, and events referring to the deleted teams no longer make sense
 * - Deleting a contraction means a later expansion draft bringing that team back is no longer needed
 * - Moving an event to a different season/phase can do either of the above
 *
 * Rather than trying to figure out what needs to be adjusted based on what changed, this replays all future events in the order they will be processed, keeping track of which teams exist and which are active. Events that are impossible at the time they would be processed are deleted, and tids of future teams are reassigned so they match what will actually happen.
 *
 * In `events`, tid is used only to identify which events refer to the same team - it is okay for those of future teams to be wrong, as long as they are consistent. A new team in an expansion draft can have an undefined tid, for a team that no other event refers to yet.
 *
 * Nothing is mutated. An event in the output is the same object as in the input, unless something in it changed. Events that are not in the future are ignored.
 */
export const normalizeScheduledEvents = <T extends ScheduledEventWithoutKey>({
	current,
	events,
	teams,
}: {
	current: SeasonPhase;
	events: T[];

	// All teams currently in the league, including disabled ones
	teams: ScheduledEventsCurrentTeam[];
}) => {
	const changes: ScheduledEventsChange<T>[] = [];
	const output: T[] = [];

	// Key is the tid from `events`, which could differ from the actual tid for future teams
	const teamsByKey = new Map<number, ScheduledEventsTeam>();

	// Future teams with no tid in `events`, so no other event can refer to them
	const teamsWithNoKey: ScheduledEventsTeam[] = [];

	for (const t of teams) {
		const t2: ScheduledEventsTeam = {
			tid: t.tid,
			active: !t.disabled,
			future: false,
		};
		copyTeamFields(t, t2);
		teamsByKey.set(t.tid, t2);
	}

	let nextTid = teams.length;

	for (const event of events.toSorted(compareScheduledEventsForTeams)) {
		if (!isFutureScheduledEvent(event, current)) {
			output.push(event);
			continue;
		}

		if (event.type === "contraction") {
			const t = teamsByKey.get(event.info.tid);
			if (!t?.active) {
				changes.push({
					type: "delete",
					event,
					reason: t ? "teamNotActive" : "teamDoesNotExist",
				});
				continue;
			}

			t.active = false;

			if (t.tid === event.info.tid) {
				output.push(event);
			} else {
				output.push({
					...event,
					info: {
						...event.info,
						tid: t.tid,
					},
				});
			}
		} else if (event.type === "teamInfo") {
			// It's fine to change the info of an inactive team
			const t = teamsByKey.get(event.info.tid);
			if (!t) {
				changes.push({
					type: "delete",
					event,
					reason: "teamDoesNotExist",
				});
				continue;
			}

			copyTeamFields(event.info, t);

			if (t.tid === event.info.tid) {
				output.push(event);
			} else {
				output.push({
					...event,
					info: {
						...event.info,
						tid: t.tid,
					},
				});
			}
		} else if (event.type === "confsDivs") {
			const keptTeams = [];
			let changed = false;

			for (const row of event.info.teams) {
				const t = teamsByKey.get(row.tid);
				if (!t) {
					// Team will not exist, so there is nothing to assign to a division
					changed = true;
					continue;
				}

				t.did = row.did;

				if (t.tid === row.tid) {
					keptTeams.push(row);
				} else {
					changed = true;
					keptTeams.push({
						...row,
						tid: t.tid,
					});
				}
			}

			if (changed) {
				output.push({
					...event,
					info: {
						...event.info,
						teams: keptTeams,
					},
				});
			} else {
				output.push(event);
			}
		} else if (event.type === "expansionDraft") {
			const keptTeams = [];
			const removedTeams = [];
			let tidChanged = false;

			for (const expansionTeam of event.info.teams) {
				// tid is not actually always defined, see the comment above this function
				const key: number | undefined = expansionTeam.tid;
				let t = key === undefined ? undefined : teamsByKey.get(key);

				if (t?.active) {
					// When processing an expansion draft, teams that are already active are ignored
					removedTeams.push(expansionTeam);
					continue;
				}

				if (t) {
					// Inactive team is coming back
					t.active = true;
				} else {
					// New team
					t = {
						tid: nextTid,
						active: true,
						future: true,
					};
					nextTid += 1;

					if (key === undefined) {
						teamsWithNoKey.push(t);
					} else {
						teamsByKey.set(key, t);
					}
				}

				copyTeamFields(expansionTeam, t);

				if (t.tid === key) {
					keptTeams.push(expansionTeam);
				} else {
					tidChanged = true;
					keptTeams.push({
						...expansionTeam,
						tid: t.tid,
					});
				}
			}

			if (keptTeams.length === 0) {
				changes.push({
					type: "delete",
					event,
					reason: "teamsAlreadyActive",
				});
				continue;
			}

			if (removedTeams.length > 0) {
				changes.push({
					type: "removeExpansionTeams",
					event,
					teams: removedTeams.map((t) => ({
						region: t.region,
						name: t.name,
					})),
				});
			}

			if (removedTeams.length === 0 && !tidChanged) {
				output.push(event);
			} else {
				output.push({
					...event,
					info: {
						...event.info,
						teams: keptTeams,
					},
				});
			}
		} else {
			output.push(event);
		}
	}

	return {
		changes,
		events: sortScheduledEvents(output),

		// State of all teams, after all events are processed
		teams: orderBy([...teamsByKey.values(), ...teamsWithNoKey], "tid"),
	};
};

// Get the state of all teams right before `target` is processed. For a confsDivs event that includes all the other events in the same season/phase, see getTeamsTypeSortValue. `target` can be a new event that is not in `events` yet, or it could be an existing event with a different season/phase than it has in `events`.
export const getTeamsBeforeScheduledEvent = ({
	current,
	events,
	target,
	teams,
}: {
	current: SeasonPhase;
	events: ScheduledEventWithoutKey[];
	target: SortableEvent;
	teams: ScheduledEventsCurrentTeam[];
}) => {
	const eventsBefore = events.filter((event) => {
		const isTarget = event.id !== undefined && event.id === target.id;
		return !isTarget && compareScheduledEventsForTeams(event, target) < 0;
	});

	return normalizeScheduledEvents({
		current,
		events: eventsBefore,
		teams,
	}).teams;
};

// Get the state of all teams after every event in the same season/phase as `target` is processed. This is when settings from `target` are first used, like playoff settings, which could depend on expansion teams that join in the same season/phase.
export const getTeamsAtEndOfScheduledEventPhase = ({
	current,
	events,
	target,
	teams,
}: {
	current: SeasonPhase;
	events: ScheduledEventWithoutKey[];
	target: SortableEvent;
	teams: ScheduledEventsCurrentTeam[];
}) => {
	const eventsThroughPhase = events.filter((event) => {
		const isTarget = event.id !== undefined && event.id === target.id;
		return !isTarget && !isAfter(event, target);
	});

	return normalizeScheduledEvents({
		current,
		events: eventsThroughPhase,
		teams,
	}).teams;
};

// awards and confsDivs events contain all the award settings or all the conferences and divisions, not just what changed. So the next one after `target` replaces everything from `target`. Same for the old way of doing this, in a gameAttributes event.
export const getNextScheduledEventReplacing = ({
	events,
	target,
}: {
	events: ScheduledEventWithoutKey[];
	target: Pick<ScheduledEventWithoutKey, "season" | "phase" | "id"> & {
		type: "awards" | "confsDivs";
	};
}) => {
	return sortScheduledEvents(events).find((event) => {
		const isTarget = event.id !== undefined && event.id === target.id;
		if (isTarget || compareScheduledEvents(target, event) >= 0) {
			return false;
		}

		if (event.type === "gameAttributes") {
			return target.type === "awards"
				? event.info.awards !== undefined
				: event.info.confs !== undefined || event.info.divs !== undefined;
		}

		return event.type === target.type;
	});
};

const SETTINGS_BEFORE_KEYS = [
	"awards",
	"confs",
	"divs",
	"numGamesPlayoffSeries",
] as const satisfies (keyof GameAttributesLeague)[];

type SettingsBefore = Pick<
	GameAttributesLeague,
	(typeof SETTINGS_BEFORE_KEYS)[number]
>;

// Get some settings right before `target` is processed, same as getTeamsBeforeScheduledEvent. These are the settings that are needed for editing scheduled events.
export const getSettingsBeforeScheduledEvent = ({
	current,
	events,
	settings,
	target,
}: {
	current: SeasonPhase;
	events: ScheduledEventWithoutKey[];

	// Current values of these settings
	settings: SettingsBefore;

	target: SortableEvent;
}) => {
	const output = {
		...settings,
	};

	for (const event of sortScheduledEvents(events)) {
		const isTarget = event.id !== undefined && event.id === target.id;
		if (
			isTarget ||
			!isFutureScheduledEvent(event, current) ||
			compareScheduledEvents(event, target) >= 0
		) {
			continue;
		}

		if (event.type === "gameAttributes") {
			for (const key of SETTINGS_BEFORE_KEYS) {
				if (event.info[key] !== undefined) {
					(output as any)[key] = event.info[key];
				}
			}
		} else if (event.type === "confsDivs") {
			output.confs = event.info.confs;
			output.divs = event.info.divs;
		} else if (event.type === "awards") {
			output.awards = event.info.awards;
		}
	}

	return output;
};
