import { afterEach, assert, beforeAll, beforeEach, test, vi } from "vitest";
import GameSim from "./index.ts";
import { player, team } from "../index.ts";
import loadTeams from "../game/loadTeams.ts";
import { g, helpers } from "../../util/index.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";

let templates: Awaited<ReturnType<typeof loadTeams>>;
let game: GameSim;

beforeAll(async () => {
	resetG();
	g.setWithoutSavingToDB("season", 2024);
	const teams = helpers.getTeamsDefault().slice(0, 2);
	await resetCache({
		players: teams.flatMap((t) =>
			Array.from({ length: 15 }, () =>
				player.generate(t.tid, 25, 2021, true, DEFAULT_LEVEL),
			),
		),
		teams: teams.map(team.generate),
		teamSeasons: teams.map((t) => team.genSeasonRow(t)),
		teamStats: teams.map((t) => team.genStatsRow(t.tid)),
	});
	templates = await loadTeams([0, 1], {});
});

beforeEach(() => {
	g.setWithoutSavingToDB("foulRateFactor", 1);
	game = new GameSim({
		gid: 0,
		teams: structuredClone([templates[0]!, templates[1]!]),
		baseInjuryRate: 0,
		doPlayByPlay: false,
		homeCourtFactor: 1,
		allStarGame: false,
		neutralSite: true,
	});
	game.o = 0;
	game.d = 1;
	game.t = 20;
	game.team[0].stat.pts = 100;
	game.team[1].stat.pts = 101;
	for (const t of game.team) {
		t.stat.ptsQtrs = [25, 25, 25, t.stat.pts - 75];
	}
	game.foulsThisQuarter = [0, 4];
	game.foulsLastTwoMinutes = [0, 0];
	game.prevPossessionOutcome = "orb";
});

afterEach(() => {
	vi.restoreAllMocks();
	g.setWithoutSavingToDB("foulRateFactor", 1);
});

test.each([0, 1, 2])("avoid bonus fouls when defensive lead is %i", (lead) => {
	game.team[1].stat.pts = 100 + lead;
	assert.strictEqual(game.probNonShootingFoul(), 0.04);
});

test.each([-7, -1, 3, 10])(
	"keep normal fouling with defensive lead %i",
	(lead) => {
		game.team[1].stat.pts = 100 + lead;
		assert.strictEqual(game.probNonShootingFoul(), 0.08);
	},
);

test("final minute boundary", () => {
	game.t = 60;
	assert.strictEqual(game.probNonShootingFoul(), 0.04);
	game.t = 60.01;
	assert.strictEqual(game.probNonShootingFoul(), 0.08);
});

test("preserve fouls to give, including the last-two-minute allowance", () => {
	game.foulsThisQuarter[1] = 3;
	assert.strictEqual(game.probNonShootingFoul(), 0.08);
	game.foulsLastTwoMinutes[1] = 1;
	assert.strictEqual(game.probNonShootingFoul(), 0.04);
});

test("respect custom bonus thresholds", () => {
	const original = g.get("foulsUntilBonus");
	try {
		g.setWithoutSavingToDB("foulsUntilBonus", [10, 10, 10]);
		assert.strictEqual(game.probNonShootingFoul(), 0.08);
	} finally {
		g.setWithoutSavingToDB("foulsUntilBonus", original);
	}
});

test("use final regulation period or overtime, including custom period counts", () => {
	game.team[0].stat.ptsQtrs.pop();
	assert.strictEqual(game.probNonShootingFoul(), 0.08);
	game.numPeriods = 3;
	assert.strictEqual(game.probNonShootingFoul(), 0.04);
	game.numPeriods = 4;
	game.team[0].stat.ptsQtrs = [25, 25, 25, 25, 0];
	game.overtimes = 1;
	game.foulsThisQuarter[1] = 3;
	assert.strictEqual(game.probNonShootingFoul(), 0.04);
});

test("no clock-based adjustment during the Elam ending", () => {
	game.elamActive = true;
	assert.strictEqual(game.probNonShootingFoul(), 0.08);
});

test.each([0, 0.5, 2])("respect foul rate setting %s", (factor) => {
	g.setWithoutSavingToDB("foulRateFactor", factor);
	assert.strictEqual(game.probNonShootingFoul(), 0.04 * factor);
});

test("possession proceeds to shot instead of an avoidable bonus foul", () => {
	vi.spyOn(Math, "random").mockReturnValue(0.06);
	const foul = vi.spyOn(game, "doPf");
	const shot = vi.spyOn(game, "doShot").mockReturnValue("fg");
	assert.strictEqual(game.getPossessionOutcome(game.getClockFactor()), "fg");
	assert.strictEqual(shot.mock.calls.length, 1);
	assert.strictEqual(foul.mock.calls.length, 0);

	game.t = 61;
	vi.spyOn(game, "doFt").mockReturnValue("ft");
	assert.strictEqual(game.getPossessionOutcome(game.getClockFactor()), "ft");
	assert.strictEqual(foul.mock.calls[0]![0].type, "pfBonus");
});

test("accidental bonus fouls remain possible", () => {
	vi.spyOn(Math, "random").mockReturnValue(0.02);
	const foul = vi.spyOn(game, "doPf");
	const freeThrows = vi.spyOn(game, "doFt").mockReturnValue("ft");
	assert.strictEqual(game.getPossessionOutcome(game.getClockFactor()), "ft");
	assert.strictEqual(foul.mock.calls[0]![0].type, "pfBonus");
	assert.strictEqual(freeThrows.mock.calls[0]![1], 2);
});

test("trailing defense still intentionally fouls", () => {
	game.team[1].stat.pts = 98;
	vi.spyOn(Math, "random").mockReturnValue(0.99);
	const foul = vi.spyOn(game, "doPf");
	vi.spyOn(game, "doFt").mockReturnValue("ft");
	assert.strictEqual(game.getClockFactor(), "intentionalFoul");
	assert.strictEqual(game.getPossessionOutcome(game.getClockFactor()), "ft");
	assert.strictEqual(foul.mock.calls[0]![0].type, "pfBonus");
});
