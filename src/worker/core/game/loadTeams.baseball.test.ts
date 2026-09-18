import { afterEach, assert, beforeEach, test } from "vitest";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { PHASE } from "../../../common/constants.ts";
import type { Player } from "../../../common/types.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import type { PlayerGameSim } from "../GameSim.baseball/types.ts";
import { player } from "../index.ts";
import { processTeam } from "./loadTeams.ts";

const season = 2016;
const statKeys = [
	"pa",
	"bb",
	"hbp",
	"sf",
	"h",
	"2b",
	"3b",
	"hr",
	"er",
	"outs",
	"w",
	"l",
	"sv",
	"bs",
	"hld",
	"sb",
];

let players: Player[];

beforeEach(async () => {
	resetG();
	await resetCache();
	players = [80, 5, 43, 101, 77, 500, 210].map((pid, index) => ({
		...player.generate(0, 25, season - 5, true, DEFAULT_LEVEL),
		pid,
		rosterOrder: [5, 0, 6, 3, 2, 4, 1][index]!,
	}));
	player.addStatsRow(players[0]!, season, false);
	const template = players[0]!.stats[0];
	const row = (values: Record<string, number | boolean>) => ({
		...structuredClone(template),
		...values,
	});

	players[0]!.stats = [
		row({ gp: 10, pa: 40, h: 12, hr: 2, bb: 5, sb: 3 }),
		row({ playoffs: true, gp: 2, pa: 8, h: 3, hr: 1 }),
	];
	// Leave a player with no stats first in roster order. The filtered batch's
	// indexes must never be used to associate later players with their stats.
	players[1]!.stats = [];
	players[2]!.stats = [
		row({ tid: 1, gp: 7, pa: 28, h: 8, hr: 2 }),
		row({ tid: 0, gp: 5, pa: 20, h: 4, hr: 1 }),
		row({ playoffs: true, gp: 3, pa: 12, h: 4, hr: 1 }),
	];
	players[3]!.stats = [
		row({ tid: 7, gp: 4, pa: 16, h: 5, hr: 1 }),
		row({ tid: 0, gp: 0 }),
	];
	players[4]!.stats = [
		row({ season: season - 1, gp: 10, pa: 400, h: 200, hr: 100 }),
	];
	players[5]!.stats = [row({ gp: 1, pa: 3, h: 1 })];
	delete players[5]!.stats[0].bb;
	players[6]!.stats = [row({ playoffs: true, gp: 2, pa: 9, h: 2, hr: 1 })];
});

afterEach(async () => {
	resetG();
	await resetCache();
});

const compareWithIndividualReads = async (
	tid: number,
	exhibitionGame?: boolean,
) => {
	const regularSeason = tid < 0 || g.get("phase") < PHASE.PLAYOFFS;
	const expected = new Map<number, Record<string, number>>();
	const originalStats = new Map(
		players.map((p) => [p.pid, structuredClone(p.stats)]),
	);
	for (const p of players) {
		// This is the former loadTeams pipeline, using the real single-player
		// selector and the same defaults for missing players and stat values.
		const processed = await idb.getCopy.playersPlus(p, {
			stats: statKeys,
			season,
			regularSeason,
			playoffs: !regularSeason,
			mergeStats: "totOnly",
		});
		expected.set(
			p.pid,
			Object.fromEntries(
				statKeys.map((key) => [key, processed?.stats[key] ?? 0]),
			),
		);
	}

	const output = await processTeam(
		{ tid, playThroughInjuries: [0, 0] },
		{ won: 5, lost: 3, tied: 0, otl: 0, cid: 0, did: 0 },
		players,
		exhibitionGame,
	);
	const actual = new Map<number, Record<string, number>>();
	for (const p of output.player as PlayerGameSim[]) {
		assert.deepEqual(p.seasonStats, expected.get(p.id), `player ${p.id}`);
		actual.set(p.id, p.seasonStats);
	}
	assert.equal(actual.size, players.length);
	for (const p of players) {
		assert.deepEqual(p.stats, originalStats.get(p.pid));
	}
	return { output, actual };
};

test("regular season stats preserve traded totals and missing-player alignment", async () => {
	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	const { output, actual } = await compareWithIndividualReads(0);
	assert.deepEqual(
		output.player.map((p: PlayerGameSim) => p.id),
		[5, 210, 77, 101, 500, 80, 43],
	);
	assert.equal(actual.get(80)!.pa, 40);
	assert.equal(actual.get(43)!.pa, 48);
	assert.equal(actual.get(43)!.hr, 3);
	assert.equal(actual.get(101)!.pa, 16);
	assert.equal(actual.get(500)!.bb, 0);
	for (const pid of [5, 77, 210]) {
		assert(Object.values(actual.get(pid)!).every((value) => value === 0));
	}
});

test("playoff season stats exclude regular seasons and default missing rows to zero", async () => {
	g.setWithoutSavingToDB("phase", PHASE.PLAYOFFS);
	const { actual } = await compareWithIndividualReads(0);
	assert.equal(actual.get(80)!.pa, 8);
	assert.equal(actual.get(43)!.pa, 12);
	assert.equal(actual.get(210)!.pa, 9);
	for (const pid of [5, 77, 101, 500]) {
		assert(Object.values(actual.get(pid)!).every((value) => value === 0));
	}
});

test.each([-1, -2])(
	"All-Star team %i keeps draft order and uses regular-season stats during playoffs",
	async (tid) => {
		g.setWithoutSavingToDB("phase", PHASE.PLAYOFFS);
		const order = players.map((p) => p.pid);
		const { output, actual } = await compareWithIndividualReads(tid);
		assert.deepEqual(
			output.player.map((p: PlayerGameSim) => p.id),
			order,
		);
		assert.equal(actual.get(80)!.pa, 40);
		assert.equal(actual.get(43)!.pa, 48);
		assert.equal(actual.get(210)!.pa, 0);
	},
);

test("exhibition loading uses the same per-player season-stat semantics", async () => {
	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	const { actual } = await compareWithIndividualReads(0, true);
	assert.equal(actual.get(43)!.pa, 48);
	assert.equal(actual.get(101)!.pa, 16);
});
