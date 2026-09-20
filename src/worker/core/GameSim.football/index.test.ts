import formations from "./formations.ts";
import { FATIGUE_POS } from "../../../common/constants.football.ts";
import type { Position } from "../../../common/types.football.ts";
import { assert, beforeAll, test, vi } from "vitest";
import GameSim from "./index.ts";
import { player, team } from "../index.ts";
import loadTeams from "../game/loadTeams.ts";
import { g, helpers } from "../../util/index.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import Play from "./Play.ts";
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

export const initGameSim = async () => {
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
		doPlayByPlay: false,
		homeCourtFactor: 1,
		allStarGame: false,
		neutralSite: false,
	});
};

beforeAll(async () => {
	await genTwoTeams();
});

test.each(["healthy", "fatigued", "injured"] as const)(
	"formation selection preserves depth order and random draws with %s players",
	async (condition) => {
		const game = await initGameSim();
		game.o = 0;
		game.d = 1;
		for (const t of game.team) {
			for (const p of t.player) {
				p.injured = condition === "injured";
				p.stat.energy = condition === "fatigued" ? 0 : 1;
			}
		}
		const offense = game.team[0].player;
		const defense = game.team[1].player;
		Object.assign(game.team[0].depth, {
			QB: offense.slice(0, 1),
			RB: offense.slice(1, 6),
			WR: offense.slice(1, 7),
			TE: offense.slice(4, 7),
			OL: offense.slice(6, 12),
		});
		Object.assign(game.team[1].depth, {
			DL: defense.slice(0, 6),
			LB: defense.slice(3, 7),
			CB: defense.slice(5, 10),
			S: defense.slice(8, 12),
		});

		const random = vi
			.spyOn(Math, "random")
			.mockReturnValue(condition === "fatigued" ? 0.99 : 0);
		try {
			game.updatePlayersOnField("startersFake");
			assert.deepEqual(game.playersOnField[0], {
				QB: offense.slice(0, 1),
				RB: offense.slice(1, 2),
				WR: offense.slice(2, 5),
				TE: offense.slice(5, 6),
				OL: offense.slice(6, 11),
			});
			assert.deepEqual(game.playersOnField[1], {
				DL: defense.slice(0, 4),
				LB: defense.slice(4, 6),
				CB: defense.slice(6, 9),
				S: defense.slice(9, 11),
			});
			// Include eligible players beyond the number needed for the formation,
			// but exclude injured players and those already used at another position.
			assert.strictEqual(
				random.mock.calls.length,
				condition === "injured" ? 0 : 28,
			);
		} finally {
			random.mockRestore();
		}
	},
);

test("consecutive selections replace a fatigued starter and restore him after recovery", async () => {
	const game = await initGameSim();
	game.o = 0;
	game.d = 1;
	// Isolate one RB spot so every random draw belongs to these two players.
	for (const t of game.team) {
		for (const pos of helpers.keys(t.depth)) {
			t.depth[pos] = [];
		}
	}
	const starter = game.team[0].player[0]!;
	const backup = game.team[0].player[1]!;
	starter.injured = false;
	backup.injured = false;
	backup.stat.energy = 1;
	const depth = [starter, backup];
	game.team[0].depth.RB = depth;

	const random = vi.spyOn(Math, "random").mockReturnValue(0.5);
	try {
		for (const energy of [1, 0, 1]) {
			starter.stat.energy = energy;
			random.mockClear();
			// The original filter/slice selection for this healthy, distinct-ID
			// depth draws for both players, including when the starter fills the spot.
			const expected = depth
				.filter((p) => !p.injured)
				.filter((p) => Math.random() < Math.min(1, p.stat.energy + 0.05))
				.slice(0, 1);
			const expectedDraws = random.mock.calls.length;

			random.mockClear();
			game.updatePlayersOnField("startersFake");
			assert.strictEqual(game.playersOnField[0].RB![0], expected[0]);
			assert.strictEqual(
				game.playersOnField[0].RB![0],
				energy === 0 ? backup : starter,
			);
			assert.strictEqual(random.mock.calls.length, expectedDraws);
		}
	} finally {
		random.mockRestore();
	}
});

test("playing time updates team totals, player fatigue, and bench recovery without live events", async () => {
	const game = await initGameSim();
	game.o = 0;
	game.d = 1;
	game.playByPlay.active = true;
	game.playByPlay.playByPlay = [];
	const [offense, defense] = game.team.map((t) => t.player);
	game.playersOnField = [
		{ QB: [offense![0]!], RB: [offense![1]!] },
		{ DL: [defense![0]!] },
	];
	for (const t of game.team) {
		t.stat.min = 0.1;
		t.stat.timePos = 0;
		for (const p of t.player) {
			p.stat.min = 0;
			p.stat.courtTime = 0;
			p.stat.benchTime = 0;
			p.stat.energy = 0.75;
			p.compositeRating.endurance = 0;
		}
	}
	offense![0]!.stat.energy = 0.02;
	const duration = 0.07;
	game.updatePlayingTime(duration);
	assert.strictEqual(game.team[0].stat.timePos, duration);
	assert.strictEqual(game.team[1].stat.timePos, 0);
	assert.strictEqual(game.team[0].stat.min, 0.1 + duration + duration);
	assert.strictEqual(game.team[1].stat.min, 0.1 + duration);
	assert.strictEqual(offense![0]!.stat.energy, 0);
	assert.strictEqual(offense![1]!.stat.energy, 0.75 - 0.08);
	assert.strictEqual(offense![1]!.stat.min, duration);
	assert.strictEqual(offense![1]!.stat.courtTime, duration);
	assert.strictEqual(offense![1]!.stat.benchTime, 0);
	assert.strictEqual(offense![2]!.stat.energy, 1);
	assert.strictEqual(offense![2]!.stat.min, 0);
	assert.strictEqual(offense![2]!.stat.benchTime, duration);
	assert.deepEqual(game.playByPlay.playByPlay, []);
});

test("kick a field goal when down 2 at the end of the game and there is little time left", async () => {
	const game = await initGameSim();

	// Down by 2, 4th quarter, ball on the opp 20 yard line, 6 seconds left
	game.awaitingKickoff = undefined;
	game.o = 0;
	game.d = 1;
	game.team[0].stat.pts = 0;
	game.team[0].stat.ptsQtrs = [0, 0, 0, game.team[0].stat.pts];
	game.team[1].stat.pts = 2;
	game.team[1].stat.ptsQtrs = [0, 0, 0, game.team[1].stat.pts];
	game.scrimmage = 80;
	game.clock = 0.01;
	game.currentPlay = new Play(game);

	assert.strictEqual(game.getPlayType(), "fieldGoalLate");
});

test("kick a field goal on 4th down to take the lead late in the game", async () => {
	const game = await initGameSim();
	game.probMadeFieldGoal = () => 0.75;

	const situationsToAlwaysKick = [
		{
			ptsDown: 2,
			clock: 2,
		},
		{
			ptsDown: 1,
			clock: 2,
		},
		{
			ptsDown: 0,
			clock: 2,
		},
		{
			ptsDown: -4,
			clock: 2,
		},
		{
			ptsDown: -5,
			clock: 2,
		},
		{
			ptsDown: -6,
			clock: 2,
		},
		{
			ptsDown: -7,
			clock: 2,
		},
		{
			ptsDown: -8,
			clock: 2,
		},
	];

	// 4th quarter, 4th down, ball on the opp 20 yard line
	for (const { ptsDown, clock } of situationsToAlwaysKick) {
		game.awaitingKickoff = undefined;
		game.o = 0;
		game.d = 1;
		game.team[0].stat.pts = 10;
		game.team[0].stat.ptsQtrs = [0, 0, 0, game.team[0].stat.pts];
		game.team[1].stat.pts = game.team[0].stat.pts + ptsDown;
		game.team[1].stat.ptsQtrs = [0, 0, 0, game.team[1].stat.pts];
		game.scrimmage = 80;
		game.clock = clock;
		game.down = 4;
		game.currentPlay = new Play(game);

		assert.strictEqual(game.getPlayType(), "fieldGoal");
	}
});

test("kick a field goal at the end of the 2nd quarter rather than running out the clock", async () => {
	const game = await initGameSim();

	// Arbitrary score, 2nd quarter, ball on the opp 20 yard line, 6 seconds left
	game.awaitingKickoff = undefined;
	game.o = 0;
	game.d = 1;
	game.team[0].stat.pts = Math.round(Math.random() * 100);
	game.team[0].stat.ptsQtrs = [0, game.team[0].stat.pts];
	game.team[1].stat.pts = Math.round(Math.random() * 100);
	game.team[1].stat.ptsQtrs = [0, game.team[1].stat.pts];
	game.scrimmage = 80;
	game.clock = 0.01;
	game.currentPlay = new Play(game);

	assert.strictEqual(game.getPlayType(), "fieldGoalLate");
});

test("kick a field goal at the end of overtime in a tie game rather than running out the clock", async () => {
	const game = await initGameSim();

	// Arbitrary score, 2nd quarter, ball on the opp 20 yard line, 6 seconds left
	game.awaitingKickoff = undefined;
	game.o = 0;
	game.d = 1;
	game.team[0].stat.pts = 21;
	game.team[0].stat.ptsQtrs = [0, 0, 0, game.team[0].stat.pts, 0];
	game.team[1].stat.pts = game.team[0].stat.pts;
	game.team[1].stat.ptsQtrs = [0, 0, 0, game.team[1].stat.pts, 0];
	game.scrimmage = 80;
	game.clock = 3 / 60;
	game.overtimes = 1;
	game.overtimeState = "bothTeamsPossessed";
	game.currentPlay = new Play(game);

	assert.strictEqual(game.getPlayType(), "fieldGoalLate");
});

test("kick a field goal in overtime if it will win the game and is very likely to go in", async () => {
	const game = await initGameSim();

	// Arbitrary score, 2nd quarter, ball on the opp 20 yard line, 6 seconds left
	game.awaitingKickoff = undefined;
	game.o = 0;
	game.d = 1;
	game.team[0].stat.pts = 21;
	game.team[0].stat.ptsQtrs = [0, 0, 0, game.team[0].stat.pts, 0];
	game.team[1].stat.pts = game.team[0].stat.pts;
	game.team[1].stat.ptsQtrs = [0, 0, 0, game.team[1].stat.pts, 0];
	game.scrimmage = 90;
	game.clock = 10;
	game.overtimes = 1;
	game.overtimeState = "firstPossession";
	game.probMadeFieldGoal = () => 0.99;
	game.currentPlay = new Play(game);

	assert(game.getPlayType() !== "fieldGoal");

	game.overtimeState = "bothTeamsPossessed";

	assert.strictEqual(game.getPlayType(), "fieldGoal");
});

test("don't punt when down late, and usually pass", async () => {
	// Down by 7, 4th quarter, ball on own 20 yard line, 4th down, 1:30 left
	const game = await initGameSim();
	game.awaitingKickoff = undefined;
	game.o = 0;
	game.d = 1;
	game.team[0].stat.pts = 0;
	game.team[0].stat.ptsQtrs = [0, 0, 0, game.team[0].stat.pts];
	game.team[1].stat.pts = 7;
	game.team[1].stat.ptsQtrs = [0, 0, 0, game.team[1].stat.pts];
	game.down = 4;
	game.scrimmage = 20;
	game.clock = 1.5;
	game.currentPlay = new Play(game);

	let numRun = 0;
	for (let i = 0; i < 100; i++) {
		const playType = game.getPlayType();
		assert(playType === "run" || playType === "pass");
		if (playType === "run") {
			numRun += 1;
		}
	}

	// Should really be 2% chance
	assert(numRun <= 10);
});

test("sack on 4th down gets recorded on correct team", async () => {
	const game = await initGameSim();

	game.awaitingKickoff = undefined;
	game.o = 0;
	game.d = 1;
	game.scrimmage = 20;
	game.down = 4;
	game.currentPlay = new Play(game);

	// Sacks always happen, no penalties
	game.probSack = () => 1;
	game.probFumble = () => 0;
	game.checkPenalties = () => false;

	game.doPass();
	game.currentPlay.commit(false);

	assert.strictEqual(game.team[0].stat.defSk, 0);
	assert.strictEqual(game.team[1].stat.defSk, 1);

	// Possession changed
	assert.strictEqual(game.o, 1);
	assert.strictEqual(game.d, 0);
});

test("interception on 4th down works", async () => {
	const game = await initGameSim();

	game.awaitingKickoff = undefined;
	game.o = 0;
	game.d = 1;
	game.scrimmage = 20;
	game.toGo = 1;
	game.down = 4;
	game.currentPlay = new Play(game);

	// Always interception
	game.probSack = () => 0;
	game.probFumble = () => 0;
	game.probInt = () => 1;
	game.probScramble = () => 0;
	game.checkPenalties = () => false;

	game.doPass();
	game.currentPlay.commit(false);

	assert.strictEqual(game.team[0].stat.defInt, 0);
	assert.strictEqual(game.team[1].stat.defInt, 1);

	// Possession changed
	assert.strictEqual(game.o, 1);
	assert.strictEqual(game.d, 0);
});

test("OT ends after failed 4th down conversion if 1st team kicked a FG", async () => {
	// Down by 3, overtime, ball on own 20 yard line, 4th down, 1:30 left
	const game = await initGameSim();
	game.awaitingKickoff = undefined;
	game.o = 0;
	game.d = 1;
	game.team[0].stat.pts = 0;
	game.team[0].stat.ptsQtrs = [0, 0, 0, 0, game.team[0].stat.pts];
	game.team[1].stat.pts = 3;
	game.team[1].stat.ptsQtrs = [0, 0, 0, 0, game.team[1].stat.pts];
	game.down = 4;
	game.scrimmage = 20;
	game.clock = 1.5;
	game.overtimeState = "secondPossession";

	// Sacks always happen, no penalties
	game.getPlayType = () => "pass";
	game.probSack = () => 1;
	game.probFumble = () => 0;
	game.checkPenalties = () => false;

	game.simPlay();

	assert.strictEqual(game.overtimeState, "over");

	// Possession changed
	assert.strictEqual(game.o, 1);
	assert.strictEqual(game.d, 0);
});

test("fumble recovered by offense should only cost one down", async () => {
	const game = await initGameSim();

	// No penalties, run the ball
	game.checkPenalties = () => false;
	game.getPlayType = () => "run";

	// Keep doing it until offense recovers
	while (true) {
		game.awaitingKickoff = undefined;
		game.awaitingAfterTouchdown = false;
		game.o = 0;
		game.d = 1;
		game.down = 1;
		game.toGo = 10;
		game.scrimmage = 20;
		game.clock = 20;

		// Just one fumble, not double fumble
		let fumbled = false;
		game.probFumble = () => {
			if (fumbled) {
				return 0;
			}

			fumbled = true;
			return 1;
		};

		game.simPlay();

		// Looking for the offense to recover, and not for a first down
		if (game.o === 0 && game.scrimmage < 30 && !game.awaitingAfterTouchdown) {
			break;
		}
	}

	assert.strictEqual(game.down, 2);

	// No possession change
	assert.strictEqual(game.o, 0);
	assert.strictEqual(game.d, 1);
});

test("formation selection matches original passes after duplicate IDs and in-place depth edits", async () => {
	const game = await initGameSim();
	game.o = 0;
	game.d = 1;
	for (const t of game.team) {
		for (const p of t.player) {
			p.injured = false;
			p.stat.energy = 1;
		}
	}
	const offense = game.team[0].player;
	const defense = game.team[1].player;
	const duplicate = {
		...offense[2]!,
		name: "Separate object with duplicate ID",
		stat: { ...offense[2]!.stat },
	};
	Object.assign(game.team[0].depth, {
		QB: offense.slice(0, 1),
		RB: offense.slice(1, 2),
		WR: [offense[2], duplicate, ...offense.slice(3, 6)],
		TE: [duplicate, ...offense.slice(3, 6)],
		OL: offense.slice(6, 12),
	});
	Object.assign(game.team[1].depth, {
		DL: defense.slice(0, 6),
		LB: defense.slice(3, 7),
		CB: defense.slice(5, 10),
		S: defense.slice(8, 12),
	});

	// The original filter/slice passes intentionally mark IDs only between passes.
	const reference = () => {
		const result: GameSim["playersOnField"] = [{}, {}];
		for (const [i, side] of ["off", "def"].entries()) {
			const t = i === 0 ? game.o : game.d;
			const used = new Set<number>();
			for (const [pos, count] of Object.entries(
				formations.normal[0]![side as "off" | "def"],
			)) {
				const depth = game.team[t]!.depth[pos as Position];
				const numPlayers = count!;
				const players = depth
					.filter((p) => !p.injured && !used.has(p.id))
					.filter((p) => {
						if (!FATIGUE_POS.has(pos as Position)) {
							return true;
						}
						let energy = p.stat.energy + 0.05;
						if (energy > 1) {
							energy = 1;
						}
						return Math.random() < (pos === "WR" ? 0.75 : 1) * energy;
					})
					.slice(0, numPlayers);
				for (const p of players) {
					used.add(p.id);
				}
				if (players.length < numPlayers) {
					players.push(
						...depth
							.filter((p) => !p.injured && !used.has(p.id))
							.slice(0, numPlayers - players.length),
					);
					for (const p of players) {
						used.add(p.id);
					}
					if (players.length < numPlayers) {
						players.push(
							...depth
								.filter((p) => !used.has(p.id))
								.slice(0, numPlayers - players.length),
						);
						for (const p of players) {
							used.add(p.id);
						}
					}
				}
				result[t as 0 | 1][pos as Position] = players;
			}
		}
		return result;
	};

	const random = vi.spyOn(Math, "random");
	try {
		for (let round = 0; round < 11; round++) {
			if (round === 1) {
				game.team[0].depth.WR.reverse();
			}
			if (round === 2) {
				duplicate.id = offense[0]!.id;
			}
			if (round === 3) {
				game.team[0].depth.WR.splice(0, 2, offense[1]!);
			}
			if (round === 4) {
				game.team[0].depth.WR = [...game.team[0].depth.WR, offense[13]!];
			}
			if (round === 5 || round === 6) {
				for (const t of game.team) {
					for (const p of t.player) {
						p.injured = round === 6 || p.id % 2 === 0;
						p.stat.energy = 0;
					}
				}
				duplicate.injured = round === 6;
			}
			if (round === 7) {
				duplicate.id = Number.NaN;
				offense[0]!.id = -0;
				offense[1]!.id = 0;
			}
			if (round === 8) {
				// Identical IDs on the opposing team must not share used status.
				defense[0]!.id = offense[0]!.id;
				defense[1]!.id = offense[2]!.id;
				defense[2]!.id = duplicate.id;
			}
			if (round === 9) {
				game.o = 1;
				game.d = 0;
			}
			if (round === 10) {
				game.o = 0;
				game.d = 1;
				for (const t of game.team) {
					for (const p of t.player) {
						p.injured = false;
						p.stat.energy = 1;
					}
				}
				duplicate.injured = false;
			}
			let state = 1 + round;
			let calls = 0;
			random.mockImplementation(() => {
				calls++;
				state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
				return state / 4294967296;
			});
			const expected = reference();
			const expectedCalls = calls;
			state = 1 + round;
			calls = 0;
			game.updatePlayersOnField("startersFake");
			assert.strictEqual(calls, expectedCalls);
			for (const t of [0, 1] as const) {
				assert.deepEqual(
					Object.keys(game.playersOnField[t]),
					Object.keys(expected[t]),
				);
				for (const pos of helpers.keys(expected[t])) {
					const actualPlayers = game.playersOnField[t][pos]!;
					assert.strictEqual(actualPlayers.length, expected[t][pos]!.length);
					for (const [i, p] of actualPlayers.entries()) {
						assert.strictEqual(p, expected[t][pos]![i]);
					}
				}
			}
		}
	} finally {
		random.mockRestore();
	}
});
