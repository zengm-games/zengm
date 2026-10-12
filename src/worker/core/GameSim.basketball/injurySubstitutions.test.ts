import { afterEach, beforeAll, beforeEach, expect, test, vi } from "vitest";
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

const makeGame = () =>
	new GameSim({
		gid: 0,
		teams: structuredClone([templates[0]!, templates[1]!]),
		baseInjuryRate: 0,
		doPlayByPlay: true,
		homeCourtFactor: 1,
		allStarGame: false,
		neutralSite: true,
	});

beforeEach(() => {
	resetG();
	game = makeGame();
	game.o = 0;
	game.d = 1;
	game.t = 300;
});

afterEach(() => vi.restoreAllMocks());

test.each(["orb", "drb", "stl", "tov", "fg"] as const)(
	"injury after %s waits for a stoppage",
	(outcome) => {
		const injured = game.playersOnCourt[0][0]!;
		const lineup = [...game.playersOnCourt[0]];
		const timeouts = [...game.timeouts];
		vi.spyOn(game, "getPossessionOutcome").mockReturnValue(outcome);
		vi.spyOn(game, "injuries")
			.mockImplementationOnce(() => {
				injured.injured = true;
				injured.newInjury = true;
				return true;
			})
			.mockReturnValue(false);
		game.simPossession();
		expect(game.playersOnCourt[0]).toEqual(lineup);
		game.simPossession();
		expect(game.playersOnCourt[0]).toEqual(lineup);
		expect(game.timeouts).toEqual(timeouts);
		vi.mocked(game.getPossessionOutcome).mockReturnValue("timeout");
		game.simPossession();
		expect(game.playersOnCourt[0]).not.toContain(injured);
		expect(game.playersOnCourt[0]).toHaveLength(game.numPlayersOnCourt);
	},
);

test.each([
	"timeout",
	"outOfBoundsDefense",
	"outOfBoundsOffense",
	"nonShootingFoul",
	"ft",
] as const)("injury at %s can be replaced immediately", (outcome) => {
	const injured = game.playersOnCourt[0][0]!;
	vi.spyOn(game, "getPossessionOutcome").mockReturnValue(outcome);
	vi.spyOn(game, "injuries").mockImplementation(() => {
		injured.injured = true;
		return true;
	});
	game.simPossession();
	expect(game.playersOnCourt[0]).not.toContain(injured);
});

test("injury on the final play waits until the next period", () => {
	const injured = game.playersOnCourt[0][0]!;
	vi.spyOn(game, "getPossessionOutcome").mockImplementation(() => {
		game.t = 0;
		return "endOfPeriod";
	});
	vi.spyOn(game, "injuries").mockImplementation(() => {
		injured.injured = true;
		return true;
	});
	game.simPossession();
	expect(game.playersOnCourt[0]).toContain(injured);
	game.doSubstitutionsIfDeadBall({ type: "newPeriod" });
	expect(game.playersOnCourt[0]).not.toContain(injured);
});

test("no substitutions after an Elam game winner", () => {
	const injured = game.playersOnCourt[0][0]!;
	vi.spyOn(game, "getPossessionOutcome").mockImplementation(() => {
		game.elamDone = true;
		return "fg";
	});
	vi.spyOn(game, "injuries").mockImplementation(() => {
		injured.injured = true;
		return true;
	});
	const subs = vi.spyOn(game, "updatePlayersOnCourt");
	game.simPossession();
	expect(subs).not.toHaveBeenCalled();
});

test("pending injuries get one event, even across several live plays", () => {
	game.baseInjuryRate = 1;
	vi.spyOn(Math, "random").mockReturnValue(0);
	const log = vi.spyOn(game.playByPlay, "logEvent");
	expect(game.injuries()).toBe(true);
	expect(game.injuries()).toBe(false);
	expect(game.injuries()).toBe(false);
	expect(
		log.mock.calls.filter(([event]) => event.type === "injury"),
	).toHaveLength(2 * game.numPlayersOnCourt);
});

test("shooting foul replaces a pending injured defender before a missed final FT", () => {
	const injured = game.playersOnCourt[1][0]!;
	const shooter = game.playersOnCourt[0][0]!;
	injured.injured = true;
	game.doPf({
		t: 1,
		type: "pfFG",
		shooter,
		fouler: game.playersOnCourt[1][1]!,
	});
	expect(game.playersOnCourt[1]).not.toContain(injured);
	expect(game.playersOnCourt[0]).toContain(shooter);
	vi.spyOn(Math, "random").mockReturnValue(0.99);
	vi.spyOn(game, "doReb").mockReturnValue("orb");
	expect(game.doFt(shooter, 2)).toBe("orb");
	expect(game.playersOnCourt[1]).not.toContain(injured);
});

test("fouling out still forces a substitution", () => {
	const fouler = game.playersOnCourt[1][0]!;
	fouler.stat.pf = g.get("foulsNeededToFoulOut") - 1;
	game.doPf({ t: 1, type: "pfNonShooting", fouler });
	expect(game.playersOnCourt[1]).not.toContain(fouler);
});

test.each([0, 0.002])(
	"full games complete with injury rate %s",
	(injuryRate) => {
		let seed = 47239;
		vi.spyOn(Math, "random").mockImplementation(() => {
			seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
			return seed / 2 ** 32;
		});
		let totalInjuries = 0;
		for (let i = 0; i < 10; i++) {
			const sim = makeGame();
			sim.baseInjuryRate = injuryRate;
			const result = sim.run();
			const injuries = sim.playByPlay.playByPlay.flatMap((event) =>
				event.type === "injury" ? [event.pid] : [],
			);
			totalInjuries += injuries.length;
			expect(new Set(injuries).size).toBe(injuries.length);
			for (const t of result.team) {
				expect(Number.isFinite(t.stat.pts)).toBe(true);
				expect(t.player.reduce((sum, p) => sum + p.stat.pts, 0)).toBe(
					t.stat.pts,
				);
				const minutes = t.player.reduce((sum, p) => sum + p.stat.min, 0);
				expect(minutes).toBeCloseTo(
					(48 + 5 * result.overtimes) * sim.numPlayersOnCourt,
					5,
				);
			}
		}
		if (injuryRate > 0) {
			expect(totalInjuries).toBeGreaterThan(0);
		} else {
			expect(totalInjuries).toBe(0);
		}
	},
);
