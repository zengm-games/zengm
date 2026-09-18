import { g } from "../../util/index.ts";
import { assert, beforeEach, test, vi } from "vitest";
import { getDepthDefense, getDepthPitchers } from "./genDepth.baseball.ts";
import { resetG } from "../../../test/helpers.ts";
import { POSITIONS } from "../../../common/constants.baseball.ts";

const makePlayers = (count: number) =>
	Array.from({ length: count }, (_, pid) => ({
		pid,
		ratings: {
			pos: "LF",
			ovrs: Object.fromEntries(POSITIONS.map((pos) => [pos, 50])),
		},
	}));

beforeEach(resetG);

test.each([false, true])(
	"defensive starters retain first ties with DH=%s",
	(dh) => {
		const players = makePlayers(12);
		const before = structuredClone(players);
		assert.deepEqual(
			getDepthDefense(players, dh),
			dh
				? [0, 1, 2, 3, 4, 5, 6, 7, 8, 11, 10, 9]
				: [0, 1, 2, 3, 4, 5, 6, 7, 11, 10, 9, 8],
		);
		assert.deepEqual(players, before);
	},
);

test("pitchers retain starter and closer priorities when all ratings tie", () => {
	const players = makePlayers(12);
	const before = structuredClone(players);
	assert.deepEqual(
		getDepthPitchers(players),
		[0, 1, 2, 4, 5, 3, 11, 10, 9, 8, 7, 6],
	);
	assert.deepEqual(players, before);
});

test("pitcher selection can replace every initial top candidate", () => {
	const players = makePlayers(10);
	for (const p of players) {
		p.ratings.ovrs.SP = 10 * p.pid;
		p.ratings.ovrs.RP = 10 * p.pid;
	}
	assert.deepEqual(getDepthPitchers(players), [9, 8, 7, 5, 4, 6, 3, 2, 1, 0]);
});

test.each([0, 1, 2, 5])(
	"depth charts handle a roster with only %s players",
	(count) => {
		const players = makePlayers(count);
		for (const result of [
			getDepthDefense(players, false),
			getDepthDefense(players, true),
			getDepthPitchers(players),
		]) {
			assert.strictEqual(result.length, count);
			assert.deepEqual(
				result.toSorted((a, b) => a - b),
				players.map((p) => p.pid),
			);
		}
	},
);

test("a missing first defensive rating retains the original selection behavior", () => {
	const players = makePlayers(12);
	delete players[0]!.ratings.ovrs.C;
	assert.strictEqual(getDepthDefense(players, true)[0], 0);
});

// Recorded from the original evaluator before permutation reuse.
const traversalFixtures = [
	{
		season: "2026",
		dh: false,
		seed: 41,
		depth: [
			2, 5, 10, 14, 16, 8, 7, 0, 3, 18, 9, 6, 13, 17, 4, 19, 11, 1, 15, 12,
		],
	},
	{
		season: "2026",
		dh: false,
		seed: 44,
		depth: [
			17, 1, 19, 5, 7, 18, 10, 15, 0, 12, 8, 4, 6, 13, 3, 14, 11, 16, 2, 9,
		],
	},
	{
		season: "2026",
		dh: true,
		seed: 41,
		depth: [
			2, 5, 10, 14, 16, 8, 7, 0, 9, 3, 18, 6, 13, 17, 4, 19, 11, 1, 15, 12,
		],
	},
	{
		season: "2026",
		dh: true,
		seed: 44,
		depth: [
			17, 1, 19, 5, 7, 18, 10, 15, 8, 0, 12, 4, 6, 13, 3, 14, 11, 16, 2, 9,
		],
	},
	{
		season: "2027",
		dh: false,
		seed: 41,
		depth: [
			2, 14, 10, 16, 5, 8, 7, 0, 3, 18, 9, 6, 13, 17, 4, 19, 11, 1, 15, 12,
		],
	},
	{
		season: "2027",
		dh: true,
		seed: 41,
		depth: [
			2, 14, 10, 16, 5, 8, 7, 0, 9, 3, 18, 6, 13, 17, 4, 19, 11, 1, 15, 12,
		],
	},
	{
		season: "0",
		dh: false,
		seed: 41,
		depth: [
			2, 5, 10, 14, 16, 8, 7, 0, 3, 18, 9, 6, 13, 17, 4, 19, 11, 1, 15, 12,
		],
	},
	{
		season: "0",
		dh: true,
		seed: 41,
		depth: [
			2, 5, 10, 14, 16, 8, 7, 0, 9, 3, 18, 6, 13, 17, 4, 19, 11, 1, 15, 12,
		],
	},
	{
		season: "NaN",
		dh: false,
		seed: 41,
		depth: [
			2, 5, 10, 14, 16, 8, 7, 0, 3, 18, 9, 6, 13, 17, 4, 19, 11, 1, 15, 12,
		],
	},
	{
		season: "NaN",
		dh: true,
		seed: 41,
		depth: [
			2, 5, 10, 14, 16, 8, 7, 0, 9, 3, 18, 6, 13, 17, 4, 19, 11, 1, 15, 12,
		],
	},
	{
		season: "Infinity",
		dh: false,
		seed: 41,
		depth: [
			2, 5, 10, 14, 16, 8, 7, 0, 3, 18, 9, 6, 13, 17, 4, 19, 11, 1, 15, 12,
		],
	},
	{
		season: "Infinity",
		dh: true,
		seed: 41,
		depth: [
			2, 5, 10, 14, 16, 8, 7, 0, 9, 3, 18, 6, 13, 17, 4, 19, 11, 1, 15, 12,
		],
	},
];

test("depth traversal stays current across seasons, DH changes, and different rosters", () => {
	const random = vi.spyOn(Math, "random").mockImplementation(() => {
		throw new Error("Depth traversal must not draw global RNG");
	});
	try {
		for (const fixture of [
			...traversalFixtures,
			...traversalFixtures.toReversed(),
		]) {
			const season = Number(fixture.season);
			for (const currentSeason of season === 0 ? [0, -0, 0] : [season]) {
				g.setWithoutSavingToDB("season", currentSeason);
				let seed = fixture.seed;
				const players = Array.from({ length: 20 }, (_, pid) => ({
					pid,
					ratings: {
						pos: POSITIONS[pid % POSITIONS.length]!,
						ovrs: Object.fromEntries(
							POSITIONS.map((pos) => {
								seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
								return [pos, seed % 101];
							}),
						),
					},
				}));
				const before = structuredClone(players);
				assert.deepEqual(getDepthDefense(players, fixture.dh), fixture.depth);
				assert.deepEqual(players, before);
			}
		}
	} finally {
		random.mockRestore();
	}
});
