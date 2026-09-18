import { afterEach, assert, beforeAll, test, vi } from "vitest";
import GameSim from "./index.ts";
import { player, team } from "../index.ts";
import loadTeams from "../game/loadTeams.ts";
import { g, helpers } from "../../util/index.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { range } from "../../../common/utils.ts";

export const genTwoTeams = async () => {
	resetG();
	g.setWithoutSavingToDB("season", 2013);
	const teamsDefault = helpers.getTeamsDefault().slice(0, 2);
	await resetCache({
		players: [
			...range(50).map(() => player.generate(0, 25, 2010, true, DEFAULT_LEVEL)),
			...range(50).map(() => player.generate(1, 25, 2010, true, DEFAULT_LEVEL)),
		],
		teams: teamsDefault.map(team.generate),
		teamSeasons: teamsDefault.map((t) => team.genSeasonRow(t)),
		teamStats: teamsDefault.map((t) => team.genStatsRow(t.tid)),
	});
};

export const initGameSim = async (doPlayByPlay: boolean) => {
	const teams = await loadTeams([0, 1], {});
	for (const t of [teams[0], teams[1]]) {
		if (t.depth !== undefined) {
			t.depth = team.getDepthPlayers(t.depth, t.player, true);
		}
	}
	return new GameSim({
		gid: 0,
		teams: [teams[0], teams[1]],
		baseInjuryRate: g.get("injuryRate"),
		doPlayByPlay,
		homeCourtFactor: 1,
		allStarGame: false,
		neutralSite: false,
		dh: true,
	});
};

beforeAll(async () => {
	await genTwoTeams();
});

afterEach(() => {
	vi.restoreAllMocks();
});

test("fielders retain position order across substitutions", async () => {
	const game = await initGameSim(false);
	const t = game.team[0];
	const originalFielders = t.fielders;
	assert.deepEqual(
		originalFielders,
		Object.values(t.playersInGameByPos).filter((p) => p.pos !== "DH"),
	);
	assert.equal(originalFielders.length, 9);

	const off = t.playersInGameByPos.C;
	const on = t.getInjuryReplacement("C");
	assert(on);
	t.substitution(off, on);

	assert.notStrictEqual(t.fielders, originalFielders);
	assert.strictEqual(
		originalFielders.find((p) => p.pos === "C"),
		off,
	);
	assert.strictEqual(t.fielders.find((p) => p.pos === "C")?.p, on);
	assert.deepEqual(
		t.fielders.map((p) => p.pos),
		originalFielders.map((p) => p.pos),
	);
});

test("injury checks visit the original batter and fielders once in order", async () => {
	const game = await initGameSim(true);
	game.team[game.o].advanceToNextBatter();
	const originalCandidates = [
		game.team[game.o].getBatter(),
		...game.team[game.d].fielders,
	];
	const replacementIds: number[] = [];
	const checkedIds: number[] = [];
	for (const t of game.team) {
		const getReplacement = () =>
			t.t.player.find((p) => p.subIndex === undefined);
		vi.spyOn(t, "getInjuryReplacement").mockImplementation(getReplacement);
		vi.spyOn(t, "getBestReliefPitcher").mockImplementation(() => {
			const p = getReplacement();
			return p ? { p, value: 1 } : undefined;
		});
	}
	vi.spyOn(game, "substitution").mockImplementation((t, off, on) => {
		checkedIds.push(off.p.id);
		replacementIds.push(on.id);
		game.team[t].substitution(off, on);
	});
	const random = vi.spyOn(Math, "random").mockReturnValue(0);
	game.checkInjuries();

	assert.deepEqual(
		checkedIds,
		originalCandidates.map((p) => p.p.id),
	);
	assert.equal(random.mock.calls.length, 10);
	assert(originalCandidates.every((p) => p.p.newInjury));
	for (const t of game.team) {
		for (const p of t.t.player) {
			if (replacementIds.includes(p.id)) {
				assert.notEqual(p.newInjury, true);
			}
		}
	}
});

test("an out updates all fielders and their team without crediting the DH", async () => {
	const game = await initGameSim(true);
	const t = game.team[game.d];
	game.logOut();
	assert.equal(game.outs, 1);
	assert.deepEqual(
		t.t.stat.outsF,
		Array.from({ length: 9 }, () => 1),
	);
	for (const fielder of t.fielders) {
		assert.equal(
			fielder.p.stat.outsF.reduce((sum: number, n: number) => sum + n, 0),
			1,
		);
	}
	assert.equal(t.playersInGameByPos.DH.p.stat.outsF.length, 0);
});

test("walk-off scoring", async () => {
	const numBasesHits = [3, 4] as const;

	for (const numBasesHit of numBasesHits) {
		const game = await initGameSim(true);

		// Game ends after walk-off hit, and no more runs score after the winning run
		game.o = 0;
		game.d = 1;
		game.inning = game.numInnings;
		game.team[0].t.stat.pts = 0;
		game.team[1].t.stat.pts = 1;

		const pitcher = game.team[game.d].playersInGameByPos.P;
		const battingOrder = game.team[game.d].playersInGameByBattingOrder;
		game.bases = [
			{
				p: battingOrder[0].p,
				responsiblePitcherPid: pitcher.p.id,
				reachedOnError: false,
			},
			{
				p: battingOrder[1].p,
				responsiblePitcherPid: pitcher.p.id,
				reachedOnError: false,
			},
			{
				p: battingOrder[2].p,
				responsiblePitcherPid: pitcher.p.id,
				reachedOnError: false,
			},
		];

		// Make sure nothing weird happens
		game.probBalk = () => 0;
		game.probWildPitch = () => 0;
		game.probPassedBall = () => 0;
		game.probHitByPitch = () => 0;
		game.probSteal = () => 0;

		// Batter makes contact
		game.getPitchOutcome = () => {
			return {
				outcome: "contact",
				pitchQuality: 1,
				swinging: true,
			};
		};

		// Batter hits the ball in play
		game.doBattedBall = () => {
			return {
				type: "line",
				direction: "left",
				speed: "hard",
			};
		};

		// Ball lands for appropriate type of hit
		game.getBattedBallOutcome = () => {
			return {
				hitTo: 7,
				hit: true,
				result: "hit",
				posDefense: [7],
				numBases: numBasesHit,
				fieldersChoiceOrDoublePlayIndex: undefined,
				responsiblePitcherPid: pitcher.p.id,
				pErrorIfNotHit: undefined,
			};
		};

		game.simPlateAppearance();
		const event = game.playByPlay
			.getPlayByPlay(game)
			?.find((event) => event.type === "hitResult");
		assert(event);

		if (numBasesHit === 3) {
			// Triple -> only first two runs score, and recorded as a single
			assert.strictEqual(game.team[0].t.stat.pts, 2);
			assert.strictEqual(event.gameWinningRunScoredWithLiveBall, true);
			assert.strictEqual(event.numBases, 1);
		} else {
			// HR -> all runs score
			assert.strictEqual(game.team[0].t.stat.pts, 4);
			assert.strictEqual(event.gameWinningRunScoredWithLiveBall, false);
			assert.strictEqual(event.numBases, 4);
		}
	}
});

test("fielding outs retain sparse, null, nonzero and NaN slots", async () => {
	const game = await initGameSim(true);
	const t = game.team[game.d];
	const initial = [
		Number.NaN,
		undefined,
		0,
		-0,
		null,
		9,
		undefined,
		-3,
		Infinity,
	];
	t.t.stat.outsF = [...initial];
	for (const fielder of t.fielders) {
		fielder.p.stat.outsF = [...initial];
	}
	game.logOut();
	const expected = [Number.NaN, 1, 1, 1, 1, 10, 1, -2, Infinity];
	assert.deepEqual(t.t.stat.outsF, expected);
	const positions = [
		"P",
		"C",
		"1B",
		"2B",
		"3B",
		"SS",
		"LF",
		"CF",
		"RF",
	] as const;
	for (const [i, pos] of positions.entries()) {
		const playerExpected = [...initial];
		playerExpected[i] = expected[i];
		assert.deepEqual(t.playersInGameByPos[pos].p.stat.outsF, playerExpected);
	}
});

test("outs credit substituted fielders and retain play-by-play stat order", async () => {
	const game = await initGameSim(true);
	const t = game.team[game.d];
	game.logOut();
	const off = t.playersInGameByPos.C;
	const on = t.getInjuryReplacement("C");
	assert(on);
	game.substitution(game.d, off, on);
	const before = game.playByPlay.playByPlay.length;
	game.logOut();
	assert.strictEqual(off.p.stat.outsF[1], 1);
	assert.strictEqual(on.stat.outsF[1], 1);
	assert.strictEqual(t.t.stat.outsF[1], 2);
	assert.deepEqual(game.playByPlay.playByPlay.slice(before), [
		{
			type: "stat",
			t: game.d,
			pid: t.playersInGameByPos.P.p.id,
			s: "outs",
			amt: 1,
		},
		...t.fielders.map(({ p }) => ({
			type: "stat" as const,
			t: game.d,
			pid: p.id,
			s: "outsF",
			amt: 1,
		})),
	]);
});
