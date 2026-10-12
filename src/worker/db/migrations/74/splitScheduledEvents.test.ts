import { assert, test } from "vitest";
import { PHASE } from "../../../../common/constants.ts";
import type { Conf, Div, NonEmptyArray } from "../../../../common/types.ts";
import { splitScheduledEvents } from "./splitScheduledEvents.ts";

const confs: NonEmptyArray<Conf> = [{ cid: 0, name: "Conf" }];
const divs: NonEmptyArray<Div> = [{ cid: 0, did: 0, name: "Div" }];
const confs2: NonEmptyArray<Conf> = [
	{ cid: 0, name: "Conf A" },
	{ cid: 1, name: "Conf B" },
];
const divs2: NonEmptyArray<Div> = [
	{ cid: 0, did: 0, name: "Div A" },
	{ cid: 1, did: 1, name: "Div B" },
];
const divs3: NonEmptyArray<Div> = [
	{ cid: 0, did: 0, name: "Div A" },
	{ cid: 1, did: 1, name: "Div B" },
	{ cid: 1, did: 2, name: "Div C" },
];

const award = (shortName: string) => ({
	shortName,
	name: shortName,
	formula: "pts",
	showStats: "offense" as const,
});

const split = (events: Parameters<typeof splitScheduledEvents>[0]["events"]) =>
	splitScheduledEvents({
		confs,
		divs,
		events,
	});

test("returns nothing if there is nothing to change", () => {
	assert.deepStrictEqual(split([]), []);
	assert.deepStrictEqual(
		split([
			{
				id: 0,
				type: "gameAttributes",
				season: 2026,
				phase: PHASE.PRESEASON,
				info: { pace: 100 },
			},
			{
				id: 1,
				type: "teamInfo",
				season: 2026,
				phase: PHASE.PRESEASON,
				info: { tid: 0, did: 1 },
			},
			{
				id: 2,
				type: "confsDivs",
				season: 2027,
				phase: PHASE.PRESEASON,
				info: { confs: confs2, divs: divs2, teams: [] },
			},
		]),
		[],
	);
});

test("splits confs, divs, and awards out of a gameAttributes event", () => {
	// The confsDivs event keeps the id, and the others are new
	assert.deepStrictEqual(
		split([
			{
				id: 5,
				type: "gameAttributes",
				season: 2026,
				phase: PHASE.DRAFT_LOTTERY,
				info: {
					awards: [award("A")],
					confs: confs2,
					divs: divs2,
					pace: 100,
				},
			},
		]),
		[
			{
				id: 5,
				type: "confsDivs",
				season: 2026,
				phase: PHASE.DRAFT_LOTTERY,
				info: { confs: confs2, divs: divs2, teams: [] },
			},
			{
				type: "gameAttributes",
				season: 2026,
				phase: PHASE.DRAFT_LOTTERY,
				info: { pace: 100 },
			},
			{
				type: "awards",
				season: 2026,
				phase: PHASE.DRAFT_LOTTERY,
				info: { awards: [award("A")] },
			},
		],
	);
});

test("gameAttributes event keeps the id if there are no confs or divs", () => {
	assert.deepStrictEqual(
		split([
			{
				id: 5,
				type: "gameAttributes",
				season: 2026,
				phase: PHASE.PRESEASON,
				info: { awards: [award("A")], pace: 100 },
			},
		]),
		[
			{
				id: 5,
				type: "gameAttributes",
				season: 2026,
				phase: PHASE.PRESEASON,
				info: { pace: 100 },
			},
			{
				type: "awards",
				season: 2026,
				phase: PHASE.PRESEASON,
				info: { awards: [award("A")] },
			},
		],
	);
});

test("no gameAttributes event is left if it only had confs, divs, and awards", () => {
	assert.deepStrictEqual(
		split([
			{
				id: 5,
				type: "gameAttributes",
				season: 2026,
				phase: PHASE.PRESEASON,
				info: { awards: [award("A")] },
			},
		]),
		[
			{
				id: 5,
				type: "awards",
				season: 2026,
				phase: PHASE.PRESEASON,
				info: { awards: [award("A")] },
			},
		],
	);
});

test("fills in confs or divs when an event only has one of them", () => {
	// Not in the order they will be processed in
	const events = split([
		{
			id: 0,
			type: "gameAttributes",
			season: 2028,
			phase: PHASE.PRESEASON,
			info: { divs: divs3 },
		},
		{
			id: 1,
			type: "gameAttributes",
			season: 2027,
			phase: PHASE.PRESEASON,
			info: { confs: confs2, divs: divs2 },
		},
		{
			id: 2,
			type: "gameAttributes",
			season: 2026,
			phase: PHASE.PRESEASON,
			info: { divs: [{ cid: 0, did: 0, name: "Renamed" }] },
		},
	]);

	assert.deepStrictEqual(
		events.map((event) => [event.id, event.season, event.type, event.info]),
		[
			[
				2,
				2026,
				"confsDivs",
				{ confs, divs: [{ cid: 0, did: 0, name: "Renamed" }], teams: [] },
			],
			[1, 2027, "confsDivs", { confs: confs2, divs: divs2, teams: [] }],
			[0, 2028, "confsDivs", { confs: confs2, divs: divs3, teams: [] }],
		],
	);
});

test("only returns events that changed, with new events in the order they will be processed in", () => {
	const events = split([
		{
			id: 0,
			type: "gameAttributes",
			season: 2026,
			phase: PHASE.DRAFT_LOTTERY,
			info: { awards: [award("B")], pace: 101 },
		},
		{
			id: 1,
			type: "teamInfo",
			season: 2026,
			phase: PHASE.DRAFT_LOTTERY,
			info: { tid: 0, did: 1 },
		},
		{
			id: 2,
			type: "gameAttributes",
			season: 2026,
			phase: PHASE.PRESEASON,
			info: { awards: [award("A")], divs: divs2, confs: confs2, pace: 100 },
		},
		{
			id: 3,
			type: "gameAttributes",
			season: 2026,
			phase: PHASE.DRAFT_LOTTERY,
			info: { pace: 102 },
		},
	]);

	assert.deepStrictEqual(
		events.map((event) => [event.id, event.type, event.info]),
		[
			[2, "confsDivs", { confs: confs2, divs: divs2, teams: [] }],
			[undefined, "gameAttributes", { pace: 100 }],
			[undefined, "awards", { awards: [award("A")] }],
			[0, "gameAttributes", { pace: 101 }],
			[undefined, "awards", { awards: [award("B")] }],
		],
	);
});

test("leaves confs or divs alone if the other one is not known", () => {
	const events = splitScheduledEvents({
		confs: undefined,
		divs: undefined,
		events: [
			{
				id: 0,
				type: "gameAttributes",
				season: 2026,
				phase: PHASE.PRESEASON,
				info: { awards: [award("A")], divs: divs2 },
			},
		],
	});

	assert.deepStrictEqual(
		events.map((event) => [event.id, event.type, event.info]),
		[
			[0, "gameAttributes", { divs: divs2 }],
			[undefined, "awards", { awards: [award("A")] }],
		],
	);
});
