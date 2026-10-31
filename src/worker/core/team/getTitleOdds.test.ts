import { afterAll, assert, beforeAll, describe, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import type { PlayoffSeries } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { getTeamStrength, simTitleOdds } from "./getTitleOdds.ts";

const NUM_SIMS = 300;

const getTeams = (ovrs?: (tid: number) => number, gamesLeft = 82) => {
	return helpers.getTeamsDefault().map((t) => ({
		eliminated: false,
		gamesLeft,
		ovr: ovrs ? ovrs(t.tid) : 50,
		teamSeason: {
			tid: t.tid,
			cid: t.cid,
			did: t.did,
			won: 0,
			lost: 0,
			otl: 0,
			tied: 0,
			wonDiv: 0,
			lostDiv: 0,
			otlDiv: 0,
			tiedDiv: 0,
			wonConf: 0,
			lostConf: 0,
			otlConf: 0,
			tiedConf: 0,
		},
	}));
};

const seriesTeam = (tid: number, seed: number, won = 0) => ({
	cid: 0,
	seed,
	tid,
	won,
});

const makeSeries = (
	series: PlayoffSeries["series"],
	currentRound: number,
	playIns?: PlayoffSeries["playIns"],
) => ({
	currentRound,
	playIns,
	season: g.get("season"),
	series,
});

// tids 0..3 in a 2 round bracket
const makeBracket = (won: [number, number] = [0, 0]) =>
	makeSeries(
		[
			[
				{ home: seriesTeam(0, 1, won[0]), away: seriesTeam(3, 4, won[1]) },
				{ home: seriesTeam(1, 2), away: seriesTeam(2, 3) },
			],
			[],
		],
		0,
	);

const sim = (args: Partial<Parameters<typeof simTitleOdds>[0]> = {}) =>
	simTitleOdds({
		numSims: NUM_SIMS,
		season: g.get("season"),
		teams: getTeams(),
		...args,
	});

beforeAll(async () => {
	resetG();
	await resetCache({});
	idb.league = mockIDBLeague();
});

afterAll(() => {
	// @ts-expect-error
	idb.league = undefined;
	resetG();
});

describe("regular season", () => {
	test("probabilities sum to 1", async () => {
		const odds = await sim({ teams: getTeams((tid) => 40 + tid) });
		const total = Object.values(odds!).reduce((sum, t) => sum + t.prob, 0);
		assert.closeTo(total, 1, 1e-9);
	});

	test("a stronger team gets higher odds with the same record", async () => {
		const odds = (await sim({ teams: getTeams((tid) => 30 + tid * 1.5) }))!;
		assert.isAbove(odds[29]!.prob, odds[0]!.prob);
	});

	test("depends on the size of the rating gap, not just rank", async () => {
		const small = (await sim({
			teams: getTeams((tid) => (tid === 0 ? 52 : 50)),
		}))!;
		const large = (await sim({
			teams: getTeams((tid) => (tid === 0 ? 75 : 50)),
		}))!;
		assert.isAbove(large[0]!.prob, small[0]!.prob * 2);
	});

	test("is deterministic", async () => {
		const teams = getTeams((tid) => 40 + tid);
		assert.deepEqual(await sim({ teams }), await sim({ teams }));
	});

	test("an eliminated team gets exactly 0, as a resolved value", async () => {
		const teams = getTeams((tid) => (tid === 0 ? 90 : 50));
		teams[0]!.eliminated = true;
		const odds = (await sim({ teams }))!;
		assert.deepEqual(odds[0], { prob: 0, resolved: true });
	});

	test("a live team with no simulated titles is not resolved", async () => {
		const odds = (await sim({
			teams: getTeams((tid) => (tid === 0 ? 0 : 50)),
		}))!;
		assert.strictEqual(odds[0]!.prob, 0);
		assert.isUndefined(odds[0]!.resolved);
	});

	test("invalid playoff settings return undefined", async () => {
		const odds = await sim({ teams: getTeams(undefined).slice(0, 3) });
		assert.isUndefined(odds);
	});
});

describe("playoffs", () => {
	beforeAll(() => {
		g.setWithoutSavingToDB("numGamesPlayoffSeries", [7, 7] as any);
		g.setWithoutSavingToDB("numPlayoffByes", 0 as any);
	});

	afterAll(() => {
		resetG();
	});

	test("a 3-0 lead beats a 0-0 start", async () => {
		const start = (await sim({ playoffSeries: makeBracket() }))!;
		const lead = (await sim({ playoffSeries: makeBracket([3, 0]) }))!;
		assert.isAbove(lead[0]!.prob, start[0]!.prob);
		assert.isBelow(lead[3]!.prob, start[3]!.prob);
	});

	test("teams out of the bracket and series losers get exactly 0", async () => {
		const odds = (await sim({ playoffSeries: makeBracket([0, 4]) }))!;
		assert.deepEqual(odds[0], { prob: 0, resolved: true });
		assert.deepEqual(odds[10], { prob: 0, resolved: true });
		assert.isAbove(odds[3]!.prob, 0);
		assert.isUndefined(odds[3]!.resolved);
	});

	test("a team with a bye advances without a game", async () => {
		const odds = (await sim({
			playoffSeries: makeSeries(
				[
					[
						{ home: seriesTeam(0, 1) },
						{ home: seriesTeam(1, 2), away: seriesTeam(2, 3) },
					],
					[],
				],
				0,
			),
			teams: getTeams((tid) => (tid === 0 ? 50 : 50)),
		}))!;
		assert.isAbove(odds[0]!.prob, odds[1]!.prob);
		assert.closeTo(odds[0]!.prob + odds[1]!.prob + odds[2]!.prob, 1, 1e-9);
	});

	test("a decided champion is resolved without simulating", async () => {
		const playoffSeries = makeSeries(
			[
				[
					{ home: seriesTeam(0, 1, 4), away: seriesTeam(3, 4) },
					{ home: seriesTeam(1, 2, 4), away: seriesTeam(2, 3) },
				],
				[{ home: seriesTeam(0, 1, 1), away: seriesTeam(1, 2, 4) }],
			],
			1,
		);
		const odds = (await sim({ numSims: 0, playoffSeries }))!;
		assert.deepEqual(odds[1], { prob: 1, resolved: true });
		assert.deepEqual(odds[0], { prob: 0, resolved: true });
		assert.deepEqual(odds[5], { prob: 0, resolved: true });
	});

	test("a bracket with a tid that no longer exists does not throw", async () => {
		const odds = (await sim({
			playoffSeries: makeBracket(),
			teams: getTeams().slice(1),
		}))!;
		assert.isAbove(odds[1]!.prob, 0);
	});

	test("reseeds later rounds", async () => {
		g.setWithoutSavingToDB("numGamesPlayoffSeries", [1, 1, 1] as any);
		g.setWithoutSavingToDB("playoffsByConf", false);

		// Seeds 1, 4, 6, and 7 advance. Without reseeding, 1 plays 4 and 6 plays 7. With reseeding, 1 plays 7 and 4 plays 6, so seed 6 can't get an easy path to the finals.
		const playoffSeries = makeSeries(
			[
				[
					{ home: seriesTeam(0, 1, 1), away: seriesTeam(7, 8) },
					{ home: seriesTeam(3, 4, 1), away: seriesTeam(4, 5) },
					{ home: seriesTeam(2, 3), away: seriesTeam(5, 6, 1) },
					{ home: seriesTeam(1, 2), away: seriesTeam(6, 7, 1) },
				],
				[],
				[],
			],
			0,
		);
		const teams = getTeams((tid) => (tid === 0 || tid === 3 ? 70 : 50));
		const getOdds = () => sim({ numSims: 3000, playoffSeries, teams });

		const notReseeded = (await getOdds())!;
		g.setWithoutSavingToDB("playoffsReseed", true);
		const reseeded = (await getOdds())!;
		g.setWithoutSavingToDB("playoffsReseed", false);
		g.setWithoutSavingToDB("playoffsByConf", true);
		g.setWithoutSavingToDB("numGamesPlayoffSeries", [7, 7] as any);

		assert.isBelow(reseeded[5]!.prob, notReseeded[5]!.prob - 0.02);
	});

	describe("play-in", () => {
		const makePlayIn = (extra?: boolean) => {
			const game0 = {
				home: seriesTeam(1, 3, 1),
				away: seriesTeam(2, 4),
			};
			const game1 = {
				home: seriesTeam(3, 5),
				away: seriesTeam(4, 6, 1),
			};
			return makeSeries(
				[
					[
						{
							home: seriesTeam(0, 1),
							away: { ...seriesTeam(2, 4), pendingPlayIn: true },
						},
						{ home: seriesTeam(1, 2), away: seriesTeam(5, 3) },
					],
					[],
				],
				-1,
				[
					(extra
						? [
								game0,
								game1,
								{ home: seriesTeam(2, 4), away: seriesTeam(4, 6, 1) },
							]
						: [game0, game1]) as any,
				],
			);
		};

		test("two games played", async () => {
			const odds = (await sim({ playoffSeries: makePlayIn() }))!;
			assert.deepEqual(odds[3], { prob: 0, resolved: true });
			assert.isUndefined(odds[2]!.resolved);
			assert.isUndefined(odds[4]!.resolved);
			assert.closeTo(
				[0, 1, 2, 4, 5].reduce((sum, tid) => sum + odds[tid]!.prob, 0),
				1,
				1e-9,
			);
		});

		test("three games played", async () => {
			const odds = (await sim({ playoffSeries: makePlayIn(true) }))!;
			assert.deepEqual(odds[2], { prob: 0, resolved: true });
			assert.isUndefined(odds[4]!.resolved);
		});
	});
});

test("a season-ending injury lowers strength, but one that heals in time does not", () => {
	const players = Array.from({ length: 10 }, (_, i) => ({
		injury: { gamesRemaining: 0, type: "Healthy" },
		pid: i,
		ratings: { ovr: 70 - i, pos: "F" },
		value: 70 - i,
	}));
	const withInjury = (gamesRemaining: number) =>
		players.map((p, i) =>
			i === 0 ? { ...p, injury: { gamesRemaining, type: "Torn ACL" } } : p,
		);
	const strength = (ps: typeof players) =>
		getTeamStrength(ps, {
			numDaysInFuture: 30,
			playoffs: false,
			t: "default",
		});

	assert.isBelow(strength(withInjury(200)), strength(players));
	assert.strictEqual(strength(withInjury(5)), strength(players));
});
