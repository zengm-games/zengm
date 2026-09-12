import { assert, beforeAll, test, vi } from "vitest";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { range } from "../../../common/utils.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { g, helpers } from "../../util/index.ts";
import { player, team } from "../index.ts";
import loadTeams from "../game/loadTeams.ts";
import GameSim from "./index.ts";

const assertClose = (actual: number, expected: number) => {
	assert(
		Math.abs(actual - expected) < 1e-10,
		`Expected ${actual} to be close to ${expected}`,
	);
};

const initGameSim = async (doPlayByPlay = false) => {
	const teams = await loadTeams([0, 1], {});

	return new GameSim({
		gid: 0,
		teams: [teams[0], teams[1]],
		baseInjuryRate: 0,
		doPlayByPlay,
		homeCourtFactor: 1,
		allStarGame: false,
		neutralSite: true,
	});
};

beforeAll(async () => {
	resetG();
	g.setWithoutSavingToDB("season", 2013);
	const teamsDefault = helpers.getTeamsDefault().slice(0, 2);
	await resetCache({
		players: [
			...range(15).map(() => player.generate(0, 25, 2010, true, DEFAULT_LEVEL)),
			...range(15).map(() => player.generate(1, 25, 2010, true, DEFAULT_LEVEL)),
		],
		teams: teamsDefault.map(team.generate),
		teamSeasons: teamsDefault.map((t) => team.genSeasonRow(t)),
		teamStats: teamsDefault.map((t) => team.genStatsRow(t.tid)),
	});
});

test("updates playing time, energy, team minutes, and play-by-play", async () => {
	const game = await initGameSim(true);
	game.playByPlay.playByPlay.length = 0;

	for (const t of [0, 1] as const) {
		game.team[t].stat.min = 0;
		for (const p of game.team[t].player) {
			p.stat.min = 0;
			p.stat.courtTime = 0;
			p.stat.benchTime = 0;
			p.stat.energy = 0.5;
		}
	}

	game.updatePlayingTime(60);

	for (const t of [0, 1] as const) {
		assertClose(game.team[t].stat.min, game.numPlayersOnCourt);

		for (const p of game.team[t].player) {
			if (game.playersOnCourt[t].includes(p)) {
				assertClose(p.stat.min, 1);
				assertClose(p.stat.courtTime, 1);
				assertClose(p.stat.benchTime, 0);
				assertClose(
					p.stat.energy,
					Math.max(
						0,
						0.5 - game.fatigueFactor * (1 - p.compositeRating.endurance),
					),
				);
			} else {
				assertClose(p.stat.min, 0);
				assertClose(p.stat.courtTime, 0);
				assertClose(p.stat.benchTime, 1);
				assertClose(p.stat.energy, 0.594);
			}
		}
	}

	const events = game.playByPlay.playByPlay;
	assert.strictEqual(events.length, 2 * game.numPlayersOnCourt);
	assert(events.every((event) => event.type === "stat" && event.s === "min"));
});

test("updates team composites without changing the rating formula", async () => {
	const game = await initGameSim();
	game.synergyFactor = 0;
	game.t = 5 * 60;
	game.elamActive = false;
	game.team[0].stat.pts = 100;
	game.team[1].stat.pts = 80;
	game.team[0].stat.ptsQtrs = [25, 25, 25, 25];
	game.team[1].stat.ptsQtrs = [20, 20, 20, 20];

	const ratings = [
		"dribbling",
		"passing",
		"rebounding",
		"defense",
		"defensePerimeter",
		"blocking",
	] as const;
	for (const t of [0, 1] as const) {
		for (const [i, p] of game.playersOnCourt[t].entries()) {
			p.stat.energy = 0.4 + 0.1 * i;
			p.stat.pf = i;
			for (const [j, rating] of ratings.entries()) {
				p.compositeRating[rating] = 0.1 + 0.02 * i + 0.01 * j + 0.03 * t;
			}
		}
	}

	const foulLimit = game.getFoulTroubleLimit();
	const expected = ratings.map((rating) =>
		([0, 1] as const).map((t) => {
			const oppT = t === 0 ? 1 : 0;
			const diff = game.team[t].stat.pts - game.team[oppT].stat.pts;
			const perfFactor = 1 - 0.2 * Math.tanh(diff / 60);
			let value = 0;
			for (const p of game.playersOnCourt[t]) {
				let foulLimitFactor = 1;
				if (
					rating === "defense" ||
					rating === "defensePerimeter" ||
					rating === "blocking"
				) {
					if (p.stat.pf === foulLimit) {
						foulLimitFactor = 0.9;
					} else if (p.stat.pf > foulLimit) {
						foulLimitFactor = 0.75;
					}
				}
				value +=
					p.compositeRating[rating] *
					game.fatigue(p.stat.energy) *
					perfFactor *
					foulLimitFactor;
			}
			return value / 5;
		}),
	);

	game.updateTeamCompositeRatings();

	for (const [r, rating] of ratings.entries()) {
		for (const t of [0, 1] as const) {
			assertClose(game.team[t].compositeRating[rating], expected[r]![t]!);
		}
	}
});

test("selects players at both ends of the weighted range", async () => {
	const game = await initGameSim();
	for (const [i, p] of game.playersOnCourt[0].entries()) {
		p.stat.energy = 1;
		p.compositeRating.usage = 0.1 + 0.1 * i;
	}

	const random = vi.spyOn(Math, "random");
	try {
		random.mockReturnValue(0);
		assert.strictEqual(
			game.pickPlayer("usage", 0, 1),
			game.playersOnCourt[0][0],
		);

		random.mockReturnValue(1 - Number.EPSILON);
		assert.strictEqual(
			game.pickPlayer("usage", 0, 1),
			game.playersOnCourt[0].at(-1),
		);
	} finally {
		random.mockRestore();
	}
});

test("simulates a complete game with internally consistent minutes", async () => {
	const game = await initGameSim();
	const result = game.run();

	for (const t of [0, 1] as const) {
		const playerMinutes = result.team[t].player.reduce(
			(sum, p) => sum + p.stat.min,
			0,
		);
		assertClose(playerMinutes, result.team[t].stat.min);
		assert(Number.isInteger(result.team[t].stat.pts));
		assert(result.team[t].stat.pts >= 0);
	}
});
