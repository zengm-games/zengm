import { afterEach, beforeAll, beforeEach, expect, test, vi } from "vitest";
import GameSim from "./index.ts";
import { player, team } from "../index.ts";
import loadTeams from "../game/loadTeams.ts";
import { g, helpers } from "../../util/index.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import * as random from "../../../common/random.ts";

let templates: Awaited<ReturnType<typeof loadTeams>>;
let game: GameSim;

beforeAll(async () => {
	resetG();
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
	resetG();
	game = new GameSim({
		gid: 0,
		teams: structuredClone([templates[0]!, templates[1]!]),
		baseInjuryRate: 0,
		doPlayByPlay: true,
		homeCourtFactor: 1,
		allStarGame: false,
		neutralSite: true,
	});
	game.o = 0;
	game.d = 1;
	game.t = 300;
	game.prevPossessionOutcome = "orb";
	game.lastOrbPlayer = game.playersOnCourt[0][0]!;
	game.isClockRunning = true;
	vi.spyOn(Math, "random").mockReturnValue(0.1);
	// A constant random draw can make the Gaussian rejection sampler loop forever.
	vi.spyOn(random, "truncGauss").mockReturnValue(5);
	vi.spyOn(game, "probTov").mockReturnValue(0);
	vi.spyOn(game, "probBlk").mockReturnValue(0);
	g.setWithoutSavingToDB("foulRateFactor", 0);
});

afterEach(() => vi.restoreAllMocks());

const shoot = (
	clockFactor?: ReturnType<GameSim["getClockFactor"]>,
	late = false,
) => game.doShot(game.playersOnCourt[0][1]!, clockFactor, true, false, late);

test("a normal putback is a quick, unassisted rim basket by the rebounder", () => {
	const rebounder = game.lastOrbPlayer!;
	const shooter = game.playersOnCourt[0][1]!;
	expect(shoot()).toBe("fg");
	expect(rebounder.stat.pts).toBe(2);
	expect(rebounder.stat.fgAtRim).toBe(1);
	expect(rebounder.stat.fgaAtRim).toBe(1);
	expect(shooter.stat.fga).toBe(0);
	expect(game.team[0].stat.ast).toBe(0);
	expect(300 - game.t).toBeLessThan(2);
	expect(game.playByPlay.playByPlay).toEqual(
		expect.arrayContaining([
			expect.objectContaining({ type: "fgaPutBack", pid: rebounder.id }),
			expect.objectContaining({ type: "fgPutBack", pid: rebounder.id }),
		]),
	);
});

test.each([
	"drb",
	"fg",
	"timeout",
	"nonShootingFoul",
	"outOfBoundsDefense",
] as const)(
	"a stale rebounder after %s does not trigger a putback",
	(outcome) => {
		game.prevPossessionOutcome = outcome;
		const info = vi.spyOn(game, "getShotInfo");
		shoot();
		expect(info.mock.calls[0]![0].putBack).toBe(false);
	},
);

test.each(["missing", "substituted", "opponent"])(
	"a %s rebounder cannot attempt a normal putback",
	(state) => {
		game.lastOrbPlayer =
			state === "missing"
				? undefined
				: state === "opponent"
					? game.playersOnCourt[1][0]
					: game.team[0].player.find(
							(p) => !game.playersOnCourt[0].includes(p),
						);
		const info = vi.spyOn(game, "getShotInfo");
		shoot();
		expect(info.mock.calls[0]![0].putBack).toBe(false);
	},
);

test("some offensive rebounds are passed out", () => {
	vi.mocked(Math.random).mockReturnValue(0.8);
	const info = vi.spyOn(game, "getShotInfo");
	shoot();
	expect(info.mock.calls[0]![0].putBack).toBe(false);
});

test("preserves slowing down while protecting a lead", () => {
	const info = vi.spyOn(game, "getShotInfo");
	shoot("maintainLead");
	expect(info.mock.calls[0]![0].putBack).toBe(false);
});

test("does not replace a needed late three with a normal putback", () => {
	game.t = 8;
	game.team[0].stat.ptsQtrs = [0, 0, 0, 0];
	game.team[1].stat.pts = 3;
	const info = vi.spyOn(game, "getShotInfo");
	shoot("catchUp");
	expect(info.mock.calls[0]![0].putBack).toBe(false);
});

test("still runs out the clock rather than shooting a putback", () => {
	const shot = vi.spyOn(game, "doShot");
	expect(game.getPossessionOutcome("runOutClock")).toBe("endOfPeriod");
	expect(shot).not.toHaveBeenCalled();
});

test.each(["Elam", "no threes"])(
	"allows a two-point putback with %s",
	(mode) => {
		game.t = 8;
		game.team[0].stat.ptsQtrs = [0, 0, 0, 0];
		game.team[1].stat.pts = 3;
		if (mode === "Elam") {
			game.elamActive = true;
		} else {
			g.setWithoutSavingToDB("threePointers", false);
		}
		const info = vi.spyOn(game, "getShotInfo");
		shoot();
		expect(info.mock.calls[0]![0].putBack).toBe(true);
	},
);

test.each(["miss", "block", "foul", "and one"])(
	"records a putback %s correctly",
	(outcome) => {
		const original = game.getShotInfo.bind(game);
		vi.spyOn(game, "getShotInfo").mockImplementation((args) => ({
			...original(args),
			blocked: outcome === "block",
			probMake: outcome === "and one" ? 1 : 0,
			probAndOne: 1,
			probMissAndFoul: outcome === "foul" ? 1 : 0,
		}));
		vi.spyOn(game, "doReb").mockReturnValue("drb");
		shoot();
		const rebounder = game.lastOrbPlayer!;
		expect(rebounder.stat.fgaAtRim).toBe(outcome === "foul" ? 0 : 1);
		expect(rebounder.stat.fga).toBe(outcome === "foul" ? 0 : 1);
		expect(rebounder.stat.fgAtRim).toBe(outcome === "and one" ? 1 : 0);
		expect(rebounder.stat.fta).toBe(
			outcome === "foul" ? 2 : outcome === "and one" ? 1 : 0,
		);
		expect(game.team[0].stat.ast).toBe(0);
	},
);

test("preserves forced last-second putbacks", () => {
	game.t = 1;
	vi.mocked(Math.random).mockReturnValue(0.8);
	const info = vi.spyOn(game, "getShotInfo");
	shoot(undefined, true);
	expect(info.mock.calls[0]![0].putBack).toBe(true);
	expect(info.mock.calls[0]![0].lateGamePutBack).toBe(true);
});

test("normal putback accuracy respects the league two-point setting", () => {
	const args = {
		currentFatigue: 1,
		lateGamePutBack: false,
		p: game.lastOrbPlayer!,
		passer: undefined,
		tipInFromOutOfBounds: false,
		putBack: true,
	};
	const normal = game.getShotInfo(args).probMake;
	g.setWithoutSavingToDB("twoPointAccuracyFactor", 0.5);
	expect(game.getShotInfo(args).probMake).toBeLessThan(normal);
});
