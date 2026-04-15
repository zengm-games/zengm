import { assert, beforeAll, test } from "vitest";
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
			t.depth = team.getDepthPlayers(t.depth, t.player);
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
