import { assert, describe, test } from "vitest";
import { PHASE } from "./constants.ts";
import {
	getTeamsBeforeScheduledEvent,
	normalizeScheduledEvents,
	type ScheduledEventMaybeId,
} from "./scheduledEvents.ts";
import loadDataBasketball from "../worker/core/realRosters/loadData.basketball.ts";
import formatScheduledEvents from "../worker/core/realRosters/formatScheduledEvents.ts";
import { range } from "./utils.ts";

const current = {
	season: 2025,
	phase: PHASE.REGULAR_SEASON,
};

// 3 teams, the last one is inactive
const teams = [
	{ tid: 0, region: "A", name: "Aa" },
	{ tid: 1, region: "B", name: "Bb" },
	{ tid: 2, region: "C", name: "Cc", disabled: true },
];

const expansionTeam = (name: string, tid: number | undefined) => {
	return {
		abbrev: name.toUpperCase(),
		region: name,
		name,
		imgURL: undefined,
		colors: ["#000000", "#cccccc", "#ffffff"],
		pop: "1",
		stadiumCapacity: "25000",
		did: "0",
		takeControl: false,
		tid,
	};
};

let nextId = 0;
const event = (
	type: ScheduledEventMaybeId["type"],
	season: number,
	info: unknown,
	phase: number = PHASE.PRESEASON,
) => {
	const id = nextId;
	nextId += 1;
	return {
		id,
		type,
		season,
		phase,
		info,
	} as ScheduledEventMaybeId & { id: number };
};

const normalize = (events: ScheduledEventMaybeId[]) => {
	return normalizeScheduledEvents({
		current,
		events,
		teams,
	});
};

// Summarize the team events, so tests are easier to read
const summarize = (events: ScheduledEventMaybeId[]) => {
	return events.map((event) => {
		if (event.type === "expansionDraft") {
			return `${event.season} expansionDraft ${event.info.teams
				.map((t) => `${t.name}=${t.tid}`)
				.join(",")}`;
		}
		if (event.type === "contraction" || event.type === "teamInfo") {
			return `${event.season} ${event.type} ${event.info.tid}`;
		}
		return `${event.season} ${event.type}`;
	});
};

describe("normalizeScheduledEvents", () => {
	test("does nothing when all events are valid", () => {
		const events = [
			event("gameAttributes", 2026, { salaryCap: 100000 }),
			event("teamInfo", 2026, { tid: 2, region: "New" }),
			event("contraction", 2026, { tid: 1 }),
			event("expansionDraft", 2026, {
				teams: [expansionTeam("c", 2), expansionTeam("d", 3)],
			}),
			event("teamInfo", 2027, { tid: 3, region: "New" }),
			event("expansionDraft", 2027, {
				teams: [expansionTeam("e", 4), expansionTeam("b", 1)],
			}),
			event("contraction", 2028, { tid: 3 }),
			event("contraction", 2028, { tid: 4 }),
			event("retirePlayer", 2029, { pid: 0 }),
			event("unretirePlayer", 2029, { pid: 0 }),
			event("expansionDraft", 2029, { teams: [expansionTeam("d", 3)] }),
		];

		const { changes, events: normalized } = normalize(events);
		assert.deepStrictEqual(changes, []);
		assert.strictEqual(normalized.length, events.length);
		for (const [normalizedEvent, event] of Iterator.zip([normalized, events], {
			mode: "strict",
		})) {
			// Same object, since nothing changed
			assert.strictEqual(normalizedEvent, event);
		}
	});

	test("sorts events in the order they are processed", () => {
		const a = event("expansionDraft", 2026, { teams: [expansionTeam("d", 3)] });
		const b = event("teamInfo", 2026, { tid: 0, region: "New" });
		const c = event("contraction", 2025, { tid: 0 }, PHASE.FREE_AGENCY);
		const d = event("gameAttributes", 2026, { salaryCap: 100000 });

		const { changes, events: normalized } = normalize([a, b, c, d]);
		assert.deepStrictEqual(changes, []);

		// expansionDraft is always last in a phase
		assert.deepStrictEqual(normalized, [c, b, d, a]);
	});

	test("ignores events that are not in the future", () => {
		const events = [
			// Would not be valid, if they were in the future
			event("contraction", 2024, { tid: 10 }),
			event("expansionDraft", 2025, { teams: [expansionTeam("d", 0)] }),
			event("contraction", 2025, { tid: 10 }, PHASE.REGULAR_SEASON),

			event("expansionDraft", 2026, { teams: [expansionTeam("d", 3)] }),
		];

		const { changes, events: normalized } = normalize(events);
		assert.deepStrictEqual(changes, []);
		assert.deepStrictEqual(normalized, events);
	});

	test("after deleting an expansion draft, deletes events for those teams and renumbers later teams", () => {
		// Deleted event was a 2026 expansion draft creating tid 3
		const events = [
			event("teamInfo", 2027, { tid: 3, region: "New" }),
			event("expansionDraft", 2027, {
				teams: [expansionTeam("e", 4), expansionTeam("f", 5)],
			}),
			event("teamInfo", 2028, { tid: 4, region: "New" }),
			event("contraction", 2028, { tid: 3 }),
			event("contraction", 2028, { tid: 5 }),
			event("teamInfo", 2029, { tid: 5, region: "New" }),
			event("teamInfo", 2029, { tid: 0, region: "New" }),
		];

		const { changes, events: normalized } = normalize(events);
		assert.deepStrictEqual(
			changes.map((change) => [
				change.type,
				change.event.id,
				change.type === "delete" ? change.reason : undefined,
			]),
			[
				["delete", events[0]!.id, "teamDoesNotExist"],
				["delete", events[3]!.id, "teamDoesNotExist"],
			],
		);
		assert.deepStrictEqual(summarize(normalized), [
			"2027 expansionDraft e=3,f=4",
			"2028 teamInfo 3",
			"2028 contraction 4",
			"2029 teamInfo 4",
			"2029 teamInfo 0",
		]);

		// Running it again on the output changes nothing
		const again = normalize(normalized);
		assert.deepStrictEqual(again.changes, []);
		assert.deepStrictEqual(again.events, normalized);
	});

	test("after deleting the expansion draft creating a team, a later expansion draft bringing it back creates it instead", () => {
		// Deleted event was a 2026 expansion draft creating tid 3
		const events = [
			event("expansionDraft", 2027, { teams: [expansionTeam("e", 4)] }),
			event("contraction", 2028, { tid: 3 }),
			event("expansionDraft", 2029, { teams: [expansionTeam("d", 3)] }),
			event("teamInfo", 2030, { tid: 3, region: "New" }),
			event("teamInfo", 2030, { tid: 4, region: "New" }),
		];

		const { changes, events: normalized } = normalize(events);
		assert.strictEqual(changes.length, 1);
		assert.strictEqual(changes[0]!.event, events[1]);
		assert.deepStrictEqual(summarize(normalized), [
			"2027 expansionDraft e=3",
			"2029 expansionDraft d=4",
			"2030 teamInfo 4",
			"2030 teamInfo 3",
		]);
	});

	test("after deleting a contraction, removes that team from the next expansion draft", () => {
		// Deleted event was a 2026 contraction of tid 1
		const events = [
			event("expansionDraft", 2027, {
				teams: [expansionTeam("b", 1), expansionTeam("d", 3)],
			}),
			event("expansionDraft", 2028, { teams: [expansionTeam("a", 0)] }),
			event("contraction", 2029, { tid: 1 }),
			event("expansionDraft", 2030, { teams: [expansionTeam("b", 1)] }),
		];

		const { changes, events: normalized } = normalize(events);
		assert.deepStrictEqual(
			changes.map((change) => [
				change.type,
				change.event.id,
				change.type === "removeExpansionTeams"
					? change.teams.map((t) => t.name)
					: change.reason,
			]),
			[
				["removeExpansionTeams", events[0]!.id, ["b"]],
				["delete", events[1]!.id, "teamsAlreadyActive"],
			],
		);
		assert.deepStrictEqual(summarize(normalized), [
			"2027 expansionDraft d=3",
			"2029 contraction 1",
			"2030 expansionDraft b=1",
		]);
	});

	test("deletes a second contraction of the same team", () => {
		const events = [
			event("contraction", 2026, { tid: 1 }),
			event("contraction", 2027, { tid: 1 }),
			event("contraction", 2027, { tid: 2 }),
		];

		const { changes, events: normalized } = normalize(events);
		assert.deepStrictEqual(
			changes.map((change) => [
				change.event.id,
				change.type === "delete" ? change.reason : undefined,
			]),
			[
				[events[1]!.id, "teamNotActive"],
				[events[2]!.id, "teamNotActive"],
			],
		);
		assert.deepStrictEqual(summarize(normalized), ["2026 contraction 1"]);
	});

	test("an event in the same phase as the expansion draft creating a team is too early", () => {
		const events = [
			event("expansionDraft", 2026, { teams: [expansionTeam("d", 3)] }),
			event("teamInfo", 2026, { tid: 3, region: "New" }),
			event("teamInfo", 2026, { tid: 3, region: "New" }, PHASE.DRAFT_LOTTERY),
		];

		const { changes, events: normalized } = normalize(events);
		assert.strictEqual(changes.length, 1);
		assert.strictEqual(changes[0]!.event, events[1]);
		assert.deepStrictEqual(normalized, [events[0]!, events[2]!]);
	});

	test("moving an expansion draft later swaps tids with a team created in between", () => {
		// The expansion draft creating tid 3 was moved from 2026 to 2028
		const events = [
			event("expansionDraft", 2028, { teams: [expansionTeam("d", 3)] }),
			event("teamInfo", 2027, { tid: 3, region: "New" }),
			event("expansionDraft", 2027, { teams: [expansionTeam("e", 4)] }),
			event("teamInfo", 2029, { tid: 3, region: "New" }),
			event("teamInfo", 2029, { tid: 4, region: "New" }),
		];

		const { changes, events: normalized } = normalize(events);
		assert.strictEqual(changes.length, 1);
		assert.strictEqual(changes[0]!.event, events[1]);
		assert.deepStrictEqual(summarize(normalized), [
			"2027 expansionDraft e=3",
			"2028 expansionDraft d=4",
			"2029 teamInfo 4",
			"2029 teamInfo 3",
		]);
	});

	test("assigns tids to new teams with no tid", () => {
		const events: ScheduledEventMaybeId[] = [
			event("expansionDraft", 2027, { teams: [expansionTeam("d", 3)] }),
			event("teamInfo", 2028, { tid: 3, region: "New" }),

			// New event, not saved yet
			{
				type: "expansionDraft",
				season: 2026,
				phase: PHASE.PRESEASON,
				info: {
					teams: [
						expansionTeam("x", undefined),
						expansionTeam("c", 2),
						expansionTeam("y", undefined),
					] as any,
				},
			},
		];

		const { changes, events: normalized } = normalize(events);
		assert.deepStrictEqual(changes, []);
		assert.deepStrictEqual(summarize(normalized), [
			"2026 expansionDraft x=3,c=2,y=4",
			"2027 expansionDraft d=5",
			"2028 teamInfo 5",
		]);
	});

	test("does not mutate input", () => {
		const events = [
			event("contraction", 2026, { tid: 5 }),
			event("expansionDraft", 2027, { teams: [expansionTeam("e", 4)] }),
			event("teamInfo", 2028, { tid: 4, region: "New" }),
		];
		const copy = structuredClone(events);

		const { events: normalized } = normalize(events);
		assert.deepStrictEqual(events, copy);
		assert.notDeepEqual(normalized, events);
	});
});

describe("getTeamsBeforeScheduledEvent", () => {
	const events = [
		event("contraction", 2026, { tid: 1 }),
		event("expansionDraft", 2026, { teams: [expansionTeam("d", 3)] }),
		event("teamInfo", 2027, { tid: 3, region: "New" }),
		event("expansionDraft", 2028, { teams: [expansionTeam("b", 1)] }),
	];

	const getTeams = (
		target: Parameters<typeof getTeamsBeforeScheduledEvent>[0]["target"],
	) => {
		return getTeamsBeforeScheduledEvent({
			current,
			events,
			target,
			teams,
		}).map((t) => `${t.tid} ${t.region} ${t.active ? "active" : "inactive"}`);
	};

	test("new event", () => {
		// expansionDraft is processed last, so a new teamInfo event is before it and a new expansionDraft event is after it
		assert.deepStrictEqual(
			getTeams({ type: "teamInfo", season: 2026, phase: PHASE.PRESEASON }),
			["0 A active", "1 B inactive", "2 C inactive"],
		);
		assert.deepStrictEqual(
			getTeams({
				type: "expansionDraft",
				season: 2026,
				phase: PHASE.PRESEASON,
			}),
			["0 A active", "1 B inactive", "2 C inactive", "3 d active"],
		);

		assert.deepStrictEqual(
			getTeams({ type: "contraction", season: 2030, phase: PHASE.PRESEASON }),
			["0 A active", "1 b active", "2 C inactive", "3 New active"],
		);
	});

	test("existing event is not applied to itself", () => {
		assert.deepStrictEqual(
			getTeams({
				...events[0]!,
				season: 2027,
			}),
			["0 A active", "1 B active", "2 C inactive", "3 d active"],
		);
	});
});

describe("real teams", () => {
	test("default scheduled events are already valid, for any starting season", async () => {
		const basketball = await loadDataBasketball();
		const scheduledEventsAll = [
			...basketball.scheduledEventsGameAttributes,
			...basketball.scheduledEventsTeams,
		];

		let numTeamEvents = 0;

		for (const keepAllTeams of [false, true]) {
			for (const season of range(1947, 2026)) {
				for (const phase of [PHASE.PRESEASON, PHASE.PLAYOFFS]) {
					const { initialTeams, scheduledEvents } = formatScheduledEvents(
						scheduledEventsAll,
						{
							keepAllTeams,
							season,
							phase,
						},
					);

					// Same ids they will get when saved to the database
					const events = scheduledEvents.map((event, id) => ({
						...event,
						id,
					}));

					const { changes, events: normalized } = normalizeScheduledEvents({
						current: { season, phase },
						events,
						teams: initialTeams,
					});

					const description = `${season} ${phase} ${keepAllTeams}`;
					assert.deepStrictEqual(changes, [], description);
					assert.deepStrictEqual(
						normalized,
						sortForComparison(events),
						description,
					);

					numTeamEvents += normalized.filter(
						(event) =>
							event.type === "expansionDraft" || event.type === "contraction",
					).length;
				}
			}
		}

		// Make sure this is actually testing something
		assert.isAbove(numTeamEvents, 100);
	});
});

// normalizeScheduledEvents returns events in the order they are processed
function sortForComparison<
	T extends { season: number; phase: number; type: string; id: number },
>(events: T[]) {
	return events.toSorted((a, b) => {
		return (
			a.season - b.season ||
			a.phase - b.phase ||
			(a.type === "expansionDraft" ? 1 : 0) -
				(b.type === "expansionDraft" ? 1 : 0) ||
			a.id - b.id
		);
	});
}
