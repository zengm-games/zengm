import fastDeepEqual from "fast-deep-equal";
import { PHASE_TEXT, PLAYER } from "../../common/constants.ts";
import { groupByUnique, orderBy } from "../../common/utils.ts";
import {
	getScheduledEventPhases,
	getTeamsBeforeScheduledEvent,
	isFutureScheduledEvent,
	normalizeScheduledEvents,
	type ScheduledEventsChange,
} from "../../common/scheduledEvents.ts";
import {
	awardSettingsSchema,
	type Phase,
	type ScheduledEvent,
	type ScheduledEventWithoutKey,
} from "../../common/types.ts";
import { FormulaEvaluators } from "../core/awards/processAwards.ts";
import { idb } from "../db/index.ts";
import { actualPhase } from "../util/actualPhase.ts";
import { g, helpers, local, toUI } from "../util/index.ts";

// During an expansion draft or fantasy draft, scheduled events for the phase it will return to have already been processed
export const getScheduledEventsCurrent = () => {
	return {
		season: g.get("season"),
		phase: actualPhase(),
	};
};

// For a team in a contraction or teamInfo event. If it's a future team, it has to be found in the expansion draft that creates it.
const getTeamName = (tid: number, events: ScheduledEventWithoutKey[]) => {
	const t = g.get("teamInfoCache")[tid];
	if (t) {
		return `${t.region} ${t.name}`;
	}

	for (const event of events) {
		if (event.type === "expansionDraft") {
			const t = event.info.teams.find((t) => t.tid === tid);
			if (t) {
				return `${t.region} ${t.name}`;
			}
		}
	}

	return `team ID ${tid}`;
};

// Describe a change made by normalizeScheduledEvents to an existing event, as a side effect of something else changing
const formatChange = (
	change: ScheduledEventsChange<ScheduledEventWithoutKey>,
	events: ScheduledEventWithoutKey[],
) => {
	const { event } = change;
	const prefix = `${event.season} ${PHASE_TEXT[event.phase]}:`;

	if (change.type === "removeExpansionTeams") {
		const names = change.teams.map((t) => `${t.region} ${t.name}`).join(", ");
		return `${prefix} ${names} will be removed from the expansion draft, because ${change.teams.length === 1 ? "that team" : "those teams"} will already be active.`;
	}

	if (event.type === "expansionDraft") {
		const names = event.info.teams
			.map((t) => `${t.region} ${t.name}`)
			.join(", ");
		return `${prefix} the expansion draft for ${names} will be deleted, because ${event.info.teams.length === 1 ? "that team" : "those teams"} will already be active.`;
	}

	if (event.type === "contraction") {
		const name = getTeamName(event.info.tid, events);
		return `${prefix} the contraction of ${name} will be deleted, because that team will ${change.reason === "teamNotActive" ? "already be inactive" : "not exist"}.`;
	}

	if (event.type === "teamInfo") {
		const name = getTeamName(event.info.tid, events);
		return `${prefix} the team info change for ${name} will be deleted, because that team will not exist yet.`;
	}

	throw new Error("Should never happen");
};

// Same as formatChange, except for when it's the event being saved that is not valid
const formatChangeAsError = (
	change: ScheduledEventsChange<ScheduledEventWithoutKey>,
) => {
	if (change.type === "removeExpansionTeams") {
		const names = change.teams.map((t) => `${t.region} ${t.name}`).join(", ");
		return `${names} will already be active at that time, so ${change.teams.length === 1 ? "it" : "they"} can't be in an expansion draft.`;
	}

	if (change.reason === "teamsAlreadyActive") {
		return "All of these teams will already be active at that time.";
	}

	if (change.reason === "teamNotActive") {
		return "That team will already be inactive at that time.";
	}

	return "That team will not exist yet at that time.";
};

const isBlank = (value: unknown) => {
	return typeof value !== "string" || value.trim() === "";
};

const isInvalidPop = (value: unknown) => {
	const pop = helpers.localeParseFloat(String(value));
	return Number.isNaN(pop) || pop < 0;
};

const isInvalidStadiumCapacity = (value: unknown) => {
	const stadiumCapacity = Number.parseInt(String(value));
	return Number.isNaN(stadiumCapacity) || stadiumCapacity < 0;
};

// Check everything that normalizeScheduledEvents doesn't. Returns an error message, if there is a problem.
const validate = async (
	event: ScheduledEventWithoutKey,
	stored: ScheduledEvent[],
) => {
	if (!g.get("godMode")) {
		return "You need to enable God Mode to add or edit scheduled events.";
	}

	if (event.id !== undefined) {
		const prevEvent = stored.find((event2) => event2.id === event.id);
		if (!prevEvent) {
			return "This scheduled event no longer exists.";
		}
		if (prevEvent.type !== event.type) {
			return "You can't change the type of a scheduled event.";
		}
	}

	if (!Number.isInteger(event.season)) {
		return "Invalid season.";
	}

	const phases: Phase[] = getScheduledEventPhases(event.type);
	if (!phases.includes(event.phase)) {
		return "Invalid phase.";
	}

	if (!isFutureScheduledEvent(event, getScheduledEventsCurrent())) {
		return "Scheduled events must be in the future.";
	}

	if (event.type === "contraction") {
		if (!Number.isInteger(event.info.tid)) {
			return "Invalid team.";
		}
	} else if (event.type === "teamInfo") {
		const { info } = event;

		if (!Number.isInteger(info.tid)) {
			return "Invalid team.";
		}

		// srID identifies the team, it doesn't change anything
		const keys = helpers
			.keys(info)
			.filter((key) => key !== "tid" && key !== "srID");
		if (keys.length === 0) {
			return "Nothing is changed by this event.";
		}

		for (const key of ["region", "name", "abbrev"] as const) {
			if (info[key] !== undefined && isBlank(info[key])) {
				return `${helpers.upperCaseFirstLetter(key)} cannot be blank.`;
			}
		}
		if (info.pop !== undefined && isInvalidPop(info.pop)) {
			return "Invalid population.";
		}
		if (
			info.stadiumCapacity !== undefined &&
			isInvalidStadiumCapacity(info.stadiumCapacity)
		) {
			return "Invalid stadium capacity.";
		}
		if (info.did !== undefined && !Number.isInteger(info.did)) {
			return "Invalid division.";
		}
	} else if (event.type === "expansionDraft") {
		const { teams } = event.info;

		if (teams.length === 0) {
			return "An expansion draft needs at least one team.";
		}

		// Starting an expansion draft while another one is in progress would not work
		const otherExpansionDraft = stored.some(
			(event2) =>
				event2.type === "expansionDraft" &&
				event2.id !== event.id &&
				event2.season === event.season &&
				event2.phase === event.phase,
		);
		if (otherExpansionDraft) {
			return "There is already an expansion draft scheduled for that season and phase. Add teams to that expansion draft instead.";
		}

		const tids = teams.map((t) => t.tid).filter((tid) => tid !== undefined);
		if (new Set(tids).size !== tids.length) {
			return "The same team can't be in an expansion draft twice.";
		}

		for (const t of teams) {
			for (const key of ["region", "name", "abbrev"] as const) {
				if (isBlank(t[key])) {
					return `${helpers.upperCaseFirstLetter(key)} cannot be blank.`;
				}
			}
			if (isInvalidPop(t.pop)) {
				return `Invalid population for ${t.abbrev}.`;
			}
			if (
				t.stadiumCapacity !== undefined &&
				isInvalidStadiumCapacity(t.stadiumCapacity)
			) {
				return `Invalid stadium capacity for ${t.abbrev}.`;
			}
			if (Number.isNaN(Number.parseInt(t.did))) {
				return `Invalid division for ${t.abbrev}.`;
			}
		}
	} else if (event.type === "gameAttributes") {
		if (Object.keys(event.info).length === 0) {
			return "Nothing is changed by this event.";
		}
	} else if (event.type === "confsDivs") {
		const { confs, divs, teams } = event.info;

		if (confs.length === 0) {
			return "There must be at least one conference.";
		}
		if (divs.length === 0) {
			return "There must be at least one division.";
		}

		// Other parts of the game assume that cid and did are the same as the index in the array
		for (const [i, conf] of confs.entries()) {
			if (conf.cid !== i) {
				return "Invalid conference.";
			}
		}
		for (const [i, div] of divs.entries()) {
			if (div.did !== i || !confs.some((conf) => conf.cid === div.cid)) {
				return "Invalid division.";
			}
		}

		const tids = teams.map((t) => t.tid);
		if (new Set(tids).size !== tids.length) {
			return "The same team can't be assigned to a division twice.";
		}
		for (const t of teams) {
			if (!Number.isInteger(t.tid)) {
				return "Invalid team.";
			}
			if (!divs.some((div) => div.did === t.did)) {
				return `Invalid division for ${getTeamName(t.tid, stored)}.`;
			}
		}

		// Every team that will be active at that time needs to wind up in a division that exists
		const teamsBefore = getTeamsBeforeScheduledEvent({
			current: getScheduledEventsCurrent(),
			events: stored,
			target: event,
			teams: await idb.cache.teams.getAll(),
		});
		for (const t of teamsBefore) {
			if (!t.active) {
				continue;
			}

			const did = teams.find((t2) => t2.tid === t.tid)?.did ?? Number(t.did);
			if (!divs.some((div) => div.did === did)) {
				return `${t.region} ${t.name} would be in a division that does not exist.`;
			}
		}
	} else if (event.type === "awards") {
		const result = awardSettingsSchema.safeParse(event.info.awards);
		if (!result.success) {
			const issue = result.error.issues[0];
			if (!issue) {
				return "Invalid award settings.";
			}

			const index = issue.path[0];
			const shortName =
				typeof index === "number"
					? event.info.awards[index]?.shortName
					: undefined;
			return shortName === undefined
				? issue.message
				: `${shortName}: ${issue.message}`;
		}

		const errorMessages = new FormulaEvaluators(event.info.awards, [])
			.errorMessages;
		if (errorMessages) {
			return errorMessages.join(" ");
		}
	} else if (event.type === "retirePlayer" || event.type === "unretirePlayer") {
		const { pid } = event.info;

		// No check for if the player is currently retired, because that could change before this event happens
		const p = await idb.merged.players.get(pid);
		if (!p) {
			return "Player not found.";
		}
		if (p.diedYear !== undefined) {
			return "That player is dead.";
		}

		const duplicate = stored.some(
			(event2) =>
				event2.type === event.type &&
				event2.id !== event.id &&
				event2.info.pid === pid &&
				event2.season === event.season &&
				event2.phase === event.phase,
		);
		if (duplicate) {
			return "That player already has the same event scheduled at the same time.";
		}
	} else {
		return "Invalid scheduled event type.";
	}
};

// Make all scheduled events valid, see normalizeScheduledEvents for details. `events` is what the scheduled events should be before any adjustments are made, which could differ from what is currently saved.
const normalize = async (events: ScheduledEventWithoutKey[]) => {
	return normalizeScheduledEvents({
		current: getScheduledEventsCurrent(),
		events,
		teams: await idb.cache.teams.getAll(),
	});
};

// Other events that are changed as a side effect of adding/editing/deleting an event
const formatChanges = (
	changes: ScheduledEventsChange<ScheduledEventWithoutKey>[],
	stored: ScheduledEvent[],
) => {
	// Team names come from what is currently saved, because that's what the user sees, and the expansion draft creating a team could be the event that is being deleted
	return changes.map((change) => formatChange(change, stored));
};

// Replace what is currently saved (`stored`) with the output of normalizeScheduledEvents
const save = async (
	normalized: ScheduledEventWithoutKey[],
	stored: ScheduledEvent[],
) => {
	const storedById = groupByUnique(stored, "id");
	const normalizedIds = new Set<number>();

	for (const event of normalized) {
		if (event.id === undefined) {
			await idb.cache.scheduledEvents.add(event);
		} else {
			normalizedIds.add(event.id);

			// normalizeScheduledEvents returns the same object if nothing changed
			if (storedById[event.id] !== event) {
				await idb.cache.scheduledEvents.put(event);
			}
		}
	}

	for (const event of stored) {
		if (!normalizedIds.has(event.id)) {
			await idb.cache.scheduledEvents.delete(event.id);
		}
	}

	await toUI("realtimeUpdate", [["scheduledEvents"]]);
};

// Run after anything that deletes or changes scheduled events without going through the functions below
export const normalizeScheduledEventsAfterChange = async () => {
	const stored = await idb.merged.scheduledEvents.getAll();
	const { events: normalized } = await normalize(stored);
	await save(normalized, stored);
};

// Call this after deleting scheduled events. `before` is a copy of all the scheduled events from before anything was deleted. Returns the key for undoing it, or undefined if nothing changed.
export const addScheduledEventsUndo = async (before: ScheduledEvent[]) => {
	const after = await idb.merged.scheduledEvents.getAll();
	const afterById = groupByUnique(after, "id");

	// Events that were deleted or changed, including ones changed as a side effect. `after` is undefined for a deleted event.
	const toRestore: {
		before: ScheduledEvent;
		after: ScheduledEvent | undefined;
	}[] = [];
	for (const event of before) {
		const eventAfter = afterById[event.id];
		if (!fastDeepEqual(event, eventAfter)) {
			toRestore.push({
				before: event,
				after: helpers.deepCopy(eventAfter),
			});
		}
	}

	if (toRestore.length === 0) {
		return;
	}

	return local.undoLog.add(async () => {
		const stored = await idb.merged.scheduledEvents.getAll();
		const storedById = groupByUnique(stored, "id");

		// If something else changed one of these events since then, restoring it would overwrite that change
		for (const { before, after } of toRestore) {
			if (!fastDeepEqual(storedById[before.id], after)) {
				return false;
			}
		}

		const restoredIds = new Set(toRestore.map(({ before }) => before.id));
		const events = [
			...stored.filter((event) => !restoredIds.has(event.id)),
			...toRestore.map(({ before }) => before),
		];

		// Other scheduled events could have been added or deleted since then. If the restored events are not valid along with them, don't undo.
		const { changes, events: normalized } = await normalize(events);
		if (changes.length > 0) {
			return false;
		}

		await save(normalized, stored);

		return true;
	}, ["leagueChange", "newPhase"]);
};

// With dryRun, nothing is saved, it just returns what would happen
export const deleteScheduledEvent = async ({
	dryRun,
	id,
}: {
	dryRun: boolean;
	id: number;
}) => {
	const stored = await idb.merged.scheduledEvents.getAll();
	const events = stored.filter((event) => event.id !== id);

	const { changes, events: normalized } = await normalize(events);

	let undoKey;
	if (!dryRun) {
		const before = helpers.deepCopy(stored);
		await save(normalized, stored);
		undoKey = await addScheduledEventsUndo(before);
	}

	return {
		changes: formatChanges(changes, stored),
		undoKey,
	};
};

// Add a new scheduled event (no id) or replace an existing one (with id). With dryRun, nothing is saved, it just returns what would happen.
export const upsertScheduledEvent = async ({
	dryRun,
	event,
}: {
	dryRun: boolean;
	event: ScheduledEventWithoutKey;
}): Promise<
	| {
			error: string;
	  }
	| {
			changes: string[];
	  }
> => {
	const stored = await idb.merged.scheduledEvents.getAll();

	const error = await validate(event, stored);
	if (error !== undefined) {
		return {
			error,
		};
	}

	const events = [...stored.filter((event2) => event2.id !== event.id), event];

	const { changes, events: normalized } = await normalize(events);

	// If the event being saved is not valid, don't save anything
	const change = changes.find((change) => change.event === event);
	if (change) {
		return {
			error: formatChangeAsError(change),
		};
	}

	if (!dryRun) {
		await save(normalized, stored);
	}

	return {
		changes: formatChanges(changes, stored),
	};
};

// Too many to send to the UI every time the scheduled events page loads
export const getPlayersForScheduledEvents = async () => {
	const teamInfoCache = g.get("teamInfoCache");

	// Only keep what's needed from each player, because reading every player object into memory at once is too much for large leagues
	const players = await idb.merged.players.getAll(undefined, {
		filter: (p) => p.diedYear === undefined,
		map: (p) => {
			let info;
			if (p.tid === PLAYER.RETIRED) {
				info = `retired ${p.retiredYear}`;
			} else if (p.tid === PLAYER.FREE_AGENT) {
				info = "free agent";
			} else if (p.tid >= 0) {
				info = teamInfoCache[p.tid]?.abbrev ?? "???";
			} else {
				info = `${p.draft.year} draft`;
			}

			return {
				pid: p.pid,
				firstName: p.firstName,
				lastName: p.lastName,
				info,
			};
		},
	});

	return orderBy(players, ["lastName", "firstName"]).map((p) => {
		return {
			pid: p.pid,
			name: `${p.firstName} ${p.lastName}`,
			info: p.info,
		};
	});
};
