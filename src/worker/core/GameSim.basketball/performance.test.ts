import { assert, beforeAll, test } from "vitest";
// @ts-expect-error Node-only test; the worker tsconfig excludes Node types.
import process from "node:process";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { PHASE } from "../../../common/constants.ts";
import { range } from "../../../common/utils.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { g, helpers } from "../../util/index.ts";
import { player, team } from "../index.ts";
import loadTeams from "../game/loadTeams.ts";
import GameSim from "./index.ts";
import ReferenceGameSim from "./performance.reference.ts";

const seededRandom = (seed: number) => () => {
	seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
	return (seed >>> 0) / 4294967296;
};

let templates: Awaited<ReturnType<typeof loadTeams>>;
beforeAll(async () => {
	const originalRandom = Math.random;
	Math.random = seededRandom(12345);
	try {
		resetG();
		g.setWithoutSavingToDB("season", 2013);
		const teams = helpers.getTeamsDefault().slice(0, 2);
		await resetCache({
			players: [0, 1].flatMap((tid) =>
				range(15).map(() =>
					player.generate(tid, 25, 2010, true, DEFAULT_LEVEL),
				),
			),
			teams: teams.map(team.generate),
			teamSeasons: teams.map((t) => team.genSeasonRow(t)),
			teamStats: teams.map((t) => team.genStatsRow(t.tid)),
		});
		templates = await loadTeams([0, 1], {});
	} finally {
		Math.random = originalRandom;
	}
});

const createGame = (
	Class: typeof GameSim,
	neutralSite = false,
	doPlayByPlay = false,
) => {
	const teams = structuredClone(templates);
	return new Class({
		gid: 0,
		teams: [teams[0], teams[1]],
		baseInjuryRate: 0.000125,
		doPlayByPlay,
		homeCourtFactor: 1,
		allStarGame: false,
		neutralSite,
	});
};

test("optimizations preserve complete seeded games across court and playoff settings", () => {
	const originalRandom = Math.random;
	try {
		for (const phase of [PHASE.REGULAR_SEASON, PHASE.PLAYOFFS]) {
			g.setWithoutSavingToDB("phase", phase);
			for (const neutralSite of [false, true]) {
				for (let seed = 1; seed <= 20; seed++) {
					Math.random = seededRandom(seed);
					const expected = createGame(
						ReferenceGameSim,
						neutralSite,
						seed <= 2,
					).run();
					Math.random = seededRandom(seed);
					const actual = createGame(GameSim, neutralSite, seed <= 2).run();
					assert.deepEqual(
						actual,
						expected,
						`phase=${phase}, neutral=${neutralSite}, seed=${seed}`,
					);
				}
			}
		}
	} finally {
		Math.random = originalRandom;
		g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	}
}, 60000);

test.each([1, 3, 6])(
	"preserves games with %i players on court and Elam endings",
	(numPlayers) => {
		const originalRandom = Math.random;
		const originalElam = g.get("elam");
		const originalNumPlayers = g.get("numPlayersOnCourt");
		try {
			g.setWithoutSavingToDB("numPlayersOnCourt", numPlayers);
			g.setWithoutSavingToDB("elam", true);
			for (let seed = 1; seed <= 10; seed++) {
				Math.random = seededRandom(seed);
				const expected = createGame(ReferenceGameSim).run();
				Math.random = seededRandom(seed);
				assert.deepEqual(createGame(GameSim).run(), expected);
			}
		} finally {
			Math.random = originalRandom;
			g.setWithoutSavingToDB("elam", originalElam);
			g.setWithoutSavingToDB("numPlayersOnCourt", originalNumPlayers);
		}
	},
	60000,
);

test("home-court adjustments invalidate cached skills", () => {
	const game = createGame(GameSim, true);
	const reference = createGame(ReferenceGameSim, true);
	for (const factor of [1, 1.1, 0.9]) {
		game.homeCourtAdvantage(factor);
		reference.homeCourtAdvantage(factor);
		game.updateSynergy();
		reference.updateSynergy();
		assert.deepEqual(
			game.team.map((t) => t.synergy),
			reference.team.map((t) => t.synergy),
		);
	}
});

// Optional, reproducible game-engine benchmark. This excludes the league DB,
// UI, draft, and offseason; do not interpret it as full-season wall time.
test.skipIf(!process.env.BBGM_BENCHMARK)(
	"benchmark 1,230 games",
	() => {
		const originalRandom = Math.random;
		const samples = { reference: [] as number[], optimized: [] as number[] };
		const run = (Class: typeof GameSim, count: number) => {
			const start = performance.now();
			for (let seed = 1; seed <= count; seed++) {
				Math.random = seededRandom(seed);
				createGame(Class).run();
			}
			return performance.now() - start;
		};
		try {
			run(ReferenceGameSim, 100);
			run(GameSim, 100);
			for (let round = 0; round < 3; round++) {
				for (const key of round % 2
					? (["optimized", "reference"] as const)
					: (["reference", "optimized"] as const)) {
					samples[key].push(
						run(key === "reference" ? ReferenceGameSim : GameSim, 1230),
					);
				}
			}
			const median = (values: number[]) =>
				[...values].sort((a, b) => a - b)[1]!;
			process.stdout.write(
				JSON.stringify({
					gamesPerSample: 1230,
					samplesMs: samples,
					elapsedTimeReductionPercent:
						100 * (1 - median(samples.optimized) / median(samples.reference)),
				}) + "\n",
			);
		} finally {
			Math.random = originalRandom;
		}
	},
	180000,
);
