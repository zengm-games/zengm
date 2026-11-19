import { afterAll, assert, beforeAll, describe, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import type { PlayoffSeries, TeamSeason } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { PHASE } from "../../../common/constants.ts";
import {
	getTeamStrength,
	getTeamOdds,
	isTeamOddsAvailable,
	simTeamOdds,
	type TeamOdds,
} from "./getTeamOdds.ts";

const NUM_SIMS = 300;

const getTeams = (ovrs?: (tid: number) => number, gamesLeft = 82) => {
	return helpers.getTeamsDefault().map((t) => ({
		clinchedPlayoffs: undefined as TeamSeason["clinchedPlayoffs"],
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

const sim = (args: Partial<Parameters<typeof simTeamOdds>[0]> = {}) =>
	simTeamOdds({
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
		const total = Object.values(odds!).reduce(
			(sum, t) => sum + t.title.prob,
			0,
		);
		assert.closeTo(total, 1, 1e-9);
	});

	test("a stronger team gets higher odds with the same record", async () => {
		const odds = (await sim({ teams: getTeams((tid) => 30 + tid * 1.5) }))!;
		assert.isAbove(odds[29]!.title.prob, odds[0]!.title.prob);
	});

	test("depends on the size of the rating gap, not just rank", async () => {
		const small = (await sim({
			teams: getTeams((tid) => (tid === 0 ? 52 : 50)),
		}))!;
		const large = (await sim({
			teams: getTeams((tid) => (tid === 0 ? 75 : 50)),
		}))!;
		assert.isAbove(large[0]!.title.prob, small[0]!.title.prob * 2);
	});

	test("is deterministic", async () => {
		const teams = getTeams((tid) => 40 + tid);
		assert.deepEqual(await sim({ teams }), await sim({ teams }));
	});

	test("an eliminated team gets exactly 0, as a resolved value", async () => {
		const teams = getTeams((tid) => (tid === 0 ? 90 : 50));
		teams[0]!.clinchedPlayoffs = "o";
		const odds = (await sim({ teams }))!;
		assert.deepEqual(odds[0]!.title, { prob: 0, resolved: true });
		assert.deepEqual(odds[0]!.playoffs, { prob: 0, resolved: true });
	});

	test("playoff odds add up to the number of playoff teams", async () => {
		const odds = (await sim({ teams: getTeams((tid) => 40 + tid) }))!;
		const total = Object.values(odds).reduce(
			(sum, t) => sum + t.playoffs.prob,
			0,
		);
		assert.closeTo(total, 2 ** g.get("numGamesPlayoffSeries").length, 1e-9);
	});

	test("clinching the playoffs is resolved, but clinching the play-in is not", async () => {
		const teams = getTeams((tid) => 40 + tid);
		teams[0]!.clinchedPlayoffs = "x";
		teams[1]!.clinchedPlayoffs = "w";
		const odds = (await sim({ teams }))!;
		assert.deepEqual(odds[0]!.playoffs, { prob: 1, resolved: true });
		assert.isUndefined(odds[1]!.playoffs.resolved);
	});

	test("with no games left and no play-in, team strength does not change who makes the playoffs", async () => {
		g.setWithoutSavingToDB("playIn", false);
		const odds = (await sim({ teams: getTeams((tid) => 40 + tid, 0) }))!;
		g.setWithoutSavingToDB("playIn", true);

		for (const { playoffs } of Object.values(odds)) {
			assert.include([0, 1], playoffs.prob);
		}
	});

	test("a live team with no simulated titles is not resolved", async () => {
		const odds = (await sim({
			teams: getTeams((tid) => (tid === 0 ? 0 : 50)),
		}))!;
		assert.strictEqual(odds[0]!.title.prob, 0);
		assert.isUndefined(odds[0]!.title.resolved);
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
		assert.isAbove(lead[0]!.title.prob, start[0]!.title.prob);
		assert.isBelow(lead[3]!.title.prob, start[3]!.title.prob);
	});

	test("teams out of the bracket and series losers get exactly 0", async () => {
		const odds = (await sim({ playoffSeries: makeBracket([0, 4]) }))!;
		assert.deepEqual(odds[0]!.title, { prob: 0, resolved: true });
		assert.deepEqual(odds[10]!.title, { prob: 0, resolved: true });

		// Losing in the playoffs still counts as making the playoffs
		assert.deepEqual(odds[0]!.playoffs, { prob: 1, resolved: true });
		assert.deepEqual(odds[10]!.playoffs, { prob: 0, resolved: true });
		assert.isAbove(odds[3]!.title.prob, 0);
		assert.isUndefined(odds[3]!.title.resolved);
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
		assert.isAbove(odds[0]!.title.prob, odds[1]!.title.prob);
		assert.closeTo(
			odds[0]!.title.prob + odds[1]!.title.prob + odds[2]!.title.prob,
			1,
			1e-9,
		);
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
		assert.deepEqual(odds[1]!.title, { prob: 1, resolved: true });
		assert.deepEqual(odds[0]!.title, { prob: 0, resolved: true });
		assert.deepEqual(odds[5]!.title, { prob: 0, resolved: true });
		assert.deepEqual(odds[1]!.playoffs, { prob: 1, resolved: true });
		assert.deepEqual(odds[5]!.playoffs, { prob: 0, resolved: true });
	});

	test("a bracket with a tid that no longer exists does not throw", async () => {
		const odds = (await sim({
			playoffSeries: makeBracket(),
			teams: getTeams().slice(1),
		}))!;
		assert.isAbove(odds[1]!.title.prob, 0);
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

		assert.isBelow(reseeded[5]!.title.prob, notReseeded[5]!.title.prob - 0.02);
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
			assert.deepEqual(odds[3]!.title, { prob: 0, resolved: true });
			assert.isUndefined(odds[2]!.title.resolved);
			assert.isUndefined(odds[4]!.title.resolved);

			// Team 1 won its play-in game, so it's in. Teams 2 and 4 play for the last spot.
			assert.deepEqual(odds[1]!.playoffs, { prob: 1, resolved: true });
			assert.deepEqual(odds[3]!.playoffs, { prob: 0, resolved: true });
			assert.isAbove(odds[2]!.playoffs.prob, 0);
			assert.isAbove(odds[4]!.playoffs.prob, 0);
			assert.closeTo(odds[2]!.playoffs.prob + odds[4]!.playoffs.prob, 1, 1e-9);
			assert.closeTo(
				[0, 1, 2, 4, 5].reduce((sum, tid) => sum + odds[tid]!.title.prob, 0),
				1,
				1e-9,
			);
		});

		test("three games played", async () => {
			const odds = (await sim({ playoffSeries: makePlayIn(true) }))!;
			assert.deepEqual(odds[2]!.title, { prob: 0, resolved: true });
			assert.isUndefined(odds[4]!.title.resolved);
		});

		test("winning the lower game does not win the third game", async () => {
			const playoffSeries = makeSeries(
				[
					[
						{
							home: seriesTeam(0, 1),
							away: { ...seriesTeam(3, 4), pendingPlayIn: true },
						},
						{
							home: seriesTeam(1, 2),
							away: { ...seriesTeam(2, 3), pendingPlayIn: true },
						},
					],
					[],
				],
				-1,
				[
					[
						{ home: seriesTeam(2, 3), away: seriesTeam(3, 4) },
						{ home: seriesTeam(4, 5), away: seriesTeam(5, 6, 1) },
					],
				] as any,
			);
			const odds = (await sim({ numSims: 3000, playoffSeries }))!;

			// Teams 2 and 3 get the winner's slot, and the loser of their game is still alive for team 5's slot
			assert.isAbove(
				odds[2]!.title.prob + odds[3]!.title.prob,
				odds[5]!.title.prob * 2,
			);
		});
	});

	test("a neutral site takes away home court", async () => {
		g.setWithoutSavingToDB("numGamesPlayoffSeries", [1, 1] as any);
		const getOdds = () => sim({ numSims: 3000, playoffSeries: makeBracket() });

		const notNeutral = (await getOdds())!;
		g.setWithoutSavingToDB("neutralSite", "playoffs");
		const neutral = (await getOdds())!;
		g.setWithoutSavingToDB("neutralSite", "never");
		g.setWithoutSavingToDB("numGamesPlayoffSeries", [7, 7] as any);

		assert.isBelow(neutral[0]!.title.prob, notNeutral[0]!.title.prob - 0.02);
	});
});

describe("getTeamOdds", () => {
	const season = 2025;

	beforeAll(async () => {
		g.setWithoutSavingToDB("season", season);
		g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
		const teams = helpers.getTeamsDefault();
		await resetCache({
			teams: teams.map((t) => ({
				...t,
				disabled: t.tid === 1,
				playThroughInjuries: [0, 4],
			})),
			teamSeasons: getTeams().map(({ teamSeason }) => ({
				...teamSeason,
				clinchedPlayoffs: teamSeason.tid === 0 ? "o" : undefined,
				season,
			})),
		});
	});

	afterAll(async () => {
		resetG();
		await resetCache({});
	});

	test("maps eliminated teams and skips disabled teams", async () => {
		const odds = (await getTeamOdds())!;
		assert.deepEqual(odds[0]!.title, { prob: 0, resolved: true });
		assert.deepEqual(odds[0]!.playoffs, { prob: 0, resolved: true });
		assert.isUndefined(odds[1]);
		assert.isDefined(odds[2]);
	});

	test("games left come from the schedule, or a full season in the preseason", async () => {
		g.setWithoutSavingToDB("playIn", false);
		const isDecided = (odds: TeamOdds) =>
			Object.values(odds).every(
				({ playoffs }) => playoffs.prob === 0 || playoffs.prob === 1,
			);

		// Nothing on the schedule, so the regular season is over
		assert.isTrue(isDecided((await getTeamOdds())!));

		g.setWithoutSavingToDB("phase", PHASE.PRESEASON);
		assert.isFalse(isDecided((await getTeamOdds())!));

		g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
		g.setWithoutSavingToDB("playIn", true);
	});

	test("returns undefined in the playoffs with no bracket", async () => {
		g.setWithoutSavingToDB("phase", PHASE.PLAYOFFS);
		assert.isUndefined(await getTeamOdds());
		g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	});
});

test("isTeamOddsAvailable", () => {
	const season = g.get("season");

	for (const phase of [
		PHASE.REGULAR_SEASON,
		PHASE.PLAYOFFS,
		PHASE.DRAFT_LOTTERY,
	]) {
		g.setWithoutSavingToDB("phase", phase);
		assert.isTrue(isTeamOddsAvailable(season));
	}

	assert.isFalse(isTeamOddsAvailable(season - 1));

	g.setWithoutSavingToDB("phase", PHASE.FANTASY_DRAFT);
	assert.isFalse(isTeamOddsAvailable(season));

	g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	g.setWithoutSavingToDB("numGamesPlayoffSeries", [] as any);
	assert.isFalse(isTeamOddsAvailable(season));
	resetG();
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
