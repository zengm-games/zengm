import { afterEach, assert, beforeAll, beforeEach, test, vi } from "vitest";
import GameSim from "./index.ts";
import { player, team } from "../index.ts";
import loadTeams from "../game/loadTeams.ts";
import { g, helpers } from "../../util/index.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";

let teams: ConstructorParameters<typeof GameSim>[0]["teams"];
let game: GameSim;

beforeAll(async () => {
	resetG();
	const teamsDefault = helpers.getTeamsDefault().slice(0, 2);
	await resetCache({
		players: [0, 1].flatMap((tid) =>
			Array.from({ length: 10 }, (_, i) => ({
				...player.generate(tid, 25, 2010, true, DEFAULT_LEVEL),
				pid: 100000 + tid * 1000 + i * 10,
			})),
		),
		teams: teamsDefault.map(team.generate),
		teamSeasons: teamsDefault.map((t) => team.genSeasonRow(t)),
		teamStats: teamsDefault.map((t) => team.genStatsRow(t.tid)),
	});
	const loaded = await loadTeams([0, 1], {});
	teams = [loaded[0], loaded[1]];
});

beforeEach(() => {
	resetG();
	vi.spyOn(Math, "random").mockReturnValue(0.5);
	const inputs = structuredClone(teams);
	for (const t of inputs) {
		for (const [i, p] of t.player.entries()) {
			p.pos = ["PG", "SG", "SF", "PF", "C"][i % 5]!;
			p.valueNoPot = 50;
			p.ptModifier = 1;
			p.injured = false;
			p.stat.energy = 1;
			p.stat.pf = 0;
		}
	}
	game = new GameSim({
		gid: 0,
		teams: inputs,
		doPlayByPlay: false,
		homeCourtFactor: 1,
		allStarGame: false,
		baseInjuryRate: 0,
		neutralSite: false,
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

test("substitutes an injured starter with sparse player IDs", () => {
	const starter = game.playersOnCourt[0][0]!;
	starter.injured = true;
	assert.isTrue(game.updatePlayersOnCourt());
	assert.notInclude(game.playersOnCourt[0], starter);
	assert.isTrue(game.playersOnCourt[0].every((p) => !p.injured));
});

test("substitutes a fouled-out starter when enough players are eligible", () => {
	const starter = game.playersOnCourt[0][0]!;
	starter.stat.pf = g.get("foulsNeededToFoulOut");
	game.updatePlayersOnCourt();
	assert.notInclude(game.playersOnCourt[0], starter);
});

test("allows fouled-out players when fewer than five players are eligible", () => {
	for (const p of game.team[0].player) {
		p.stat.pf = g.get("foulsNeededToFoulOut");
	}
	const injured = game.playersOnCourt[0][0]!;
	injured.injured = true;
	game.updatePlayersOnCourt();
	assert.lengthOf(game.playersOnCourt[0], 5);
	assert.notInclude(game.playersOnCourt[0], injured);
	assert.isTrue(game.playersOnCourt[0].every((p) => !p.injured));
});

test("counts zero-rated players as eligible before allowing fouled-out players", () => {
	for (const p of game.team[0].player) {
		p.ptModifier = 0;
	}
	const starter = game.playersOnCourt[0][0]!;
	starter.stat.pf = g.get("foulsNeededToFoulOut");
	game.updatePlayersOnCourt();
	assert.notInclude(game.playersOnCourt[0], starter);
});

test("does not substitute the free-throw shooter", () => {
	const shooter = game.playersOnCourt[0][0]!;
	shooter.injured = true;
	game.updatePlayersOnCourt({ shooter });
	assert.include(game.playersOnCourt[0], shooter);
});

test("respects a custom lineup size when counting eligible players", () => {
	game.numPlayersOnCourt = 3;
	game.playersOnCourt = [
		game.playersOnCourt[0].slice(0, 3),
		game.playersOnCourt[1].slice(0, 3),
	];
	for (const p of game.team[0].player) {
		p.stat.pf = g.get("foulsNeededToFoulOut");
	}
	for (const p of game.team[0].player.slice(5, 8)) {
		p.stat.pf = 0;
	}
	game.updatePlayersOnCourt();
	assert.lengthOf(game.playersOnCourt[0], 3);
	assert.isTrue(game.playersOnCourt[0].every((p) => p.stat.pf === 0));
});

test("rejects an unbalanced substitute before accepting the next valid guard", () => {
	const starter = game.playersOnCourt[0][0]!;
	starter.valueNoPot = 10;
	starter.stat.courtTime = 3;
	const first = game.team[0].player[5]!;
	const second = game.team[0].player[6]!;
	first.pos = "SF";
	second.pos = "PG";
	first.stat.benchTime = 3;
	second.stat.benchTime = 3;
	game.updatePlayersOnCourt();
	assert.notInclude(game.playersOnCourt[0], first);
	assert.include(game.playersOnCourt[0], second);
	assert.notInclude(game.playersOnCourt[0], starter);
});

test("retains an eligible starter at the minimum court-time boundary", () => {
	const starter = game.playersOnCourt[0][0]!;
	starter.stat.courtTime = 2;
	starter.valueNoPot = 0;
	for (const p of game.team[0].player.slice(5)) {
		p.stat.benchTime = 3;
		p.valueNoPot = 100;
	}
	game.updatePlayersOnCourt();
	assert.include(game.playersOnCourt[0], starter);
});

test("updates court and bench time while bounding fatigue", () => {
	const starter = game.playersOnCourt[0][0]!;
	const bench = game.team[0].player[5]!;
	starter.stat.energy = 0.001;
	starter.compositeRating.endurance = 0;
	bench.stat.energy = 0.99;
	const starterBefore = { ...starter.stat };
	const benchBefore = { ...bench.stat };
	const teamMin = game.team[0].stat.min;

	game.updatePlayingTime(60);

	assert.strictEqual(starter.stat.min, starterBefore.min + 1);
	assert.strictEqual(starter.stat.courtTime, starterBefore.courtTime + 1);
	assert.strictEqual(starter.stat.benchTime, starterBefore.benchTime);
	assert.strictEqual(starter.stat.energy, 0);
	assert.strictEqual(bench.stat.min, benchBefore.min);
	assert.strictEqual(bench.stat.courtTime, benchBefore.courtTime);
	assert.strictEqual(bench.stat.benchTime, benchBefore.benchTime + 1);
	assert.strictEqual(bench.stat.energy, 1);
	assert.strictEqual(game.team[0].stat.min, teamMin + 5);
});

test("playing time logs minutes but not internal fatigue or rotation stats", () => {
	game.playByPlay.active = true;
	game.updatePlayingTime(30);
	const events = game.playByPlay.getPlayByPlay({})!;
	const statEvents = events.filter((event) => event.type === "stat");
	assert.lengthOf(statEvents, 10);
	assert.isTrue(
		statEvents.every((event) => event.s === "min" && event.amt === 0.5),
	);
});

test("games played stays one and preserves live stat events", () => {
	const p = game.playersOnCourt[0][0]!;
	game.playByPlay.active = true;
	const teamGP = game.team[0].stat.gp;
	game.recordStat(0, p, "gp", 2);
	game.recordStat(0, p, "gp");
	game.recordStat(0, undefined, "gp");
	assert.strictEqual(p.stat.gp, 1);
	assert.strictEqual(game.team[0].stat.gp, teamGP);
	assert.deepEqual(game.playByPlay.getPlayByPlay({})!.slice(1), [
		{ type: "stat", t: 0, pid: p.id, s: "gp", amt: 2 },
		{ type: "stat", t: 0, pid: p.id, s: "gp", amt: 1 },
		{ type: "stat", t: 0, pid: undefined, s: "gp", amt: 1 },
	]);
});
