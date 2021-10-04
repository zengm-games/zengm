import assert from "assert";
import Play from "./Play";
import { genTwoTeams, initGameSim } from "./index.test";

describe("worker/core/GameSim.football/Play", () => {
	beforeAll(async () => {
		await genTwoTeams();
	});

	describe("penalty situations", () => {
		test("offensive penalties on pass -> confirm penalty yardage applied against line of scrimmage", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 1;
			game.toGo = 10;
			game.scrimmage = 19;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("pass");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			assert.strictEqual(play.state.current.scrimmage, 19, "before snap");

			play.addEvent({
				type: "dropback",
			});
			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Pass interference",
				penYds: 10,
				spotYds: undefined,
				t: game.o,
			});
			play.addEvent({
				type: "pss",
				qb: p,
				target: p,
			});
			play.addEvent({
				type: "pssCmp",
				qb: p,
				target: p,
				yds: 21,
			});

			assert.strictEqual(
				play.state.current.scrimmage,
				40,
				"before penalty application",
			);

			play.adjudicatePenalties();

			// This is 10, not 9, because it's doing half the distance to the goal
			assert.strictEqual(
				play.state.current.scrimmage,
				10,
				"after penalty application",
			);
		});

		test("penalty on kick return -> kick being over should be reflected in state", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.awaitingKickoff = 0;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("kickoff");
			const po = game.pickPlayer(game.o);
			const pd = game.pickPlayer(game.d);

			const play = game.currentPlay;

			play.addEvent({
				type: "k",
				kickTo: 40,
			});
			play.addEvent({
				type: "possessionChange",
				yds: 0,
				kickoff: true,
			});

			assert.strictEqual(play.state.current.scrimmage, 40, "before return");

			play.addEvent({
				type: "penalty",
				p: po,
				automaticFirstDown: true,
				name: "Horse collar tackle",
				penYds: 15,
				spotYds: 4,
				t: play.state.current.d,
			});
			play.addEvent({
				type: "kr",
				p: pd,
				yds: 10,
			});

			assert.strictEqual(
				play.state.current.scrimmage,
				50,
				"before penalty application",
			);

			play.commit();

			assert.strictEqual(
				play.state.current.scrimmage,
				59,
				"after penalty application",
			);

			assert.strictEqual(
				game.awaitingKickoff,
				undefined,
				"awaitingKickoff is persisted",
			);
		});

		test("1st and 10 after penalty on kick return", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.awaitingKickoff = 0;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("kickoff");
			const pd = game.pickPlayer(game.d);

			const play = game.currentPlay;

			play.addEvent({
				type: "k",
				kickTo: 40,
			});
			play.addEvent({
				type: "possessionChange",
				yds: 0,
				kickoff: true,
			});

			assert.strictEqual(play.state.current.scrimmage, 40, "before return");

			play.addEvent({
				type: "penalty",
				p: pd,
				automaticFirstDown: false,
				name: "Holding",
				penYds: 10,
				spotYds: 8,
				t: game.d,
			});
			play.addEvent({
				type: "kr",
				p: pd,
				yds: 10,
			});

			assert.strictEqual(
				play.state.current.scrimmage,
				50,
				"before penalty application",
			);

			play.commit();

			assert.strictEqual(
				play.state.current.scrimmage,
				38,
				"after penalty application",
			);

			assert.strictEqual(game.down, 1, "down");

			assert.strictEqual(game.toGo, 10, "toGo");
		});

		for (const [toGo, finalPts, better, doesNot] of [
			[10, 3, "better", "does not"],
			[1, 0, "worse", "does"],
		] as any) {
			test(`made FG is ${better} than a 5 yard penalty that ${doesNot} give a 1st down`, async () => {
				const game = await initGameSim();
				game.o = 0;
				game.d = 1;
				game.down = 4;
				game.toGo = toGo;
				game.scrimmage = 80;
				game.currentPlay = new Play(game);

				game.updatePlayersOnField("fieldGoal");
				const distance = 100 - game.scrimmage + 17;
				const p = game.pickPlayer(game.o);

				const play = game.currentPlay;

				assert.deepStrictEqual(play.state.current.pts, [0, 0], "before snap");

				play.addEvent({
					type: "penalty",
					p,
					automaticFirstDown: false,
					name: "Too many men on the field",
					penYds: 5,
					spotYds: undefined,
					t: game.d,
				});

				play.addEvent({
					type: "fg",
					p,
					made: true,
					distance,
					late: false,
				});

				assert.deepStrictEqual(
					play.state.current.pts,
					[3, 0],
					"before penalty application",
				);

				play.adjudicatePenalties();

				assert.deepStrictEqual(
					play.state.current.pts,
					[finalPts, 0],
					"after penalty application",
				);
			});
		}

		test("made late FG is better than a 5 yard penalty that does give a 1st down", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 4;
			game.toGo = 1;
			game.scrimmage = 80;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("fieldGoal");
			const distance = 100 - game.scrimmage + 17;
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			assert.deepStrictEqual(play.state.current.pts, [0, 0], "before snap");

			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Too many men on the field",
				penYds: 5,
				spotYds: undefined,
				t: game.d,
			});

			play.addEvent({
				type: "fg",
				p,
				made: true,
				distance,
				late: true,
			});

			assert.deepStrictEqual(
				play.state.current.pts,
				[3, 0],
				"before penalty application",
			);

			play.adjudicatePenalties();

			assert.deepStrictEqual(
				play.state.current.pts,
				[3, 0],
				"after penalty application",
			);
		});

		test("accept penalty to prevent TD", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 1;
			game.toGo = 10;
			game.scrimmage = 29;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("pass");
			const p = game.pickPlayer(game.o);
			const qb = game.getTopPlayerOnField(game.o, "QB");
			const target = game.getTopPlayerOnField(game.o, "WR");

			const play = game.currentPlay;

			assert.deepStrictEqual(play.state.current.pts, [0, 0], "before snap");

			play.addEvent({
				type: "dropback",
			});
			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Holding",
				penYds: 10,
				spotYds: 0,
				t: game.o,
			});
			play.addEvent({
				type: "pss",
				qb,
				target,
			});

			const { td } = play.addEvent({
				type: "pssCmp",
				qb,
				target,
				yds: 100 - game.scrimmage,
			});

			assert.deepStrictEqual(td, true);

			play.addEvent({
				type: "pssTD",
				qb,
				target,
			});

			assert.deepStrictEqual(
				play.state.current.pts,
				[6, 0],
				"before penalty application",
			);

			play.adjudicatePenalties();

			assert.deepStrictEqual(
				play.state.current.pts,
				[0, 0],
				"after penalty application",
			);
		});

		test("automatic first down penalty -> 1st and 10", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 2;
			game.toGo = 16;
			game.scrimmage = 24;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("pass");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "dropback",
			});
			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: true,
				name: "Unnecessary roughness",
				penYds: 15,
				spotYds: 0,
				t: game.d,
			});
			play.addEvent({
				type: "pss",
				qb: p,
				target: p,
			});
			play.addEvent({
				type: "pssInc",
				defender: undefined,
			});

			play.commit();

			assert.strictEqual(play.state.current.down, 1);
			assert.strictEqual(play.state.current.toGo, 10);
			assert.strictEqual(play.state.current.scrimmage, 39);
		});

		test("penalty on offense on made xp -> accept", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 1;
			game.toGo = 10;
			game.scrimmage = 90;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("fieldGoal");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Unnecessary roughness",
				penYds: 15,
				spotYds: 0,
				t: game.o,
			});
			play.addEvent({
				type: "xp",
				p,
				distance: 33,
				made: true,
			});

			assert.deepStrictEqual(play.state.current.pts, [1, 0]);

			play.adjudicatePenalties();

			assert.deepStrictEqual(play.state.current.pts, [0, 0]);
		});

		test("penalty on offense on missed xp -> decline", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 1;
			game.toGo = 10;
			game.scrimmage = 90;
			game.awaitingKickoff = undefined;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("fieldGoal");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Unnecessary roughness",
				penYds: 15,
				spotYds: 0,
				t: game.o,
			});
			play.addEvent({
				type: "xp",
				p,
				distance: 33,
				made: false,
			});

			assert.deepStrictEqual(
				play.state.current.awaitingKickoff,
				0,
				"before declining penalty",
			);

			play.adjudicatePenalties();

			assert.deepStrictEqual(
				play.state.current.awaitingKickoff,
				0,
				"after declining penalty",
			);
		});

		test("offensive penalty on pass -> down does not increase", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 2;
			game.toGo = 2;
			game.scrimmage = 28;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("pass");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "dropback",
			});
			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Holding",
				penYds: 10,
				spotYds: 4,
				t: game.o,
			});
			play.addEvent({
				type: "pss",
				qb: p,
				target: p,
			});
			play.addEvent({
				type: "pssCmp",
				qb: p,
				target: p,
				yds: 6,
			});

			assert.strictEqual(
				play.state.current.down,
				3,
				"before penalty application",
			);

			play.commit();

			assert.strictEqual(
				play.state.current.down,
				2,
				"after penalty application",
			);
		});

		test("defense usually prefers 4th down over 3rd down", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 3;
			game.toGo = 10;
			game.scrimmage = 40;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("pass");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "dropback",
			});
			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Holding",
				penYds: 10,
				spotYds: undefined,
				t: game.o,
			});
			play.addEvent({
				type: "pss",
				qb: p,
				target: p,
			});
			play.addEvent({
				type: "pssInc",
				defender: p,
			});

			assert.strictEqual(
				play.state.current.down,
				4,
				"before penalty application",
			);

			play.commit();

			assert.strictEqual(
				play.state.current.down,
				4,
				"after penalty application",
			);
		});
	});

	describe("overtime", () => {
		const initOvertime = async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.team[0].stat.ptsQtrs = [0, 0, 0, 0, 0];
			game.team[0].stat.ptsQtrs = [0, 0, 0, 0, 0];

			return game;
		};

		it("touchdown on first possession -> over", async () => {
			const game = await initOvertime();
			game.overtimeState = "firstPossession";
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("run");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "rusTD",
				p,
			});

			play.commit();

			assert.deepEqual(game.overtimeState, "over");
		});

		it("FG on first possession -> not over", async () => {
			const game = await initOvertime();
			game.overtimeState = "firstPossession";
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("fieldGoal");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "fg",
				p,
				distance: 30,
				made: true,
				late: false,
			});

			play.commit();

			assert.deepEqual(game.overtimeState, "firstPossession");
		});

		it("FG on second possession -> over", async () => {
			const game = await initOvertime();
			game.overtimeState = "secondPossession";
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("fieldGoal");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "fg",
				p,
				distance: 30,
				made: true,
				late: false,
			});

			play.commit();

			assert.deepEqual(game.overtimeState, "over");
		});

		it("safety on first possession -> over", async () => {
			const game = await initOvertime();
			game.overtimeState = "firstPossession";
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("run");
			const p = game.pickPlayer(game.d);

			const play = game.currentPlay;

			play.addEvent({
				type: "defSft",
				p,
			});

			play.commit();

			assert.deepEqual(game.overtimeState, "over");
		});

		it("touchdown on first possession negated by penalty -> not over", async () => {
			const game = await initOvertime();
			game.overtimeState = "firstPossession";
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("run");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Holding",
				penYds: 10,
				spotYds: 0,
				t: game.o,
			});

			play.addEvent({
				type: "rusTD",
				p,
			});

			play.commit();

			assert.deepEqual(game.overtimeState, "firstPossession");
		});
	});

	describe("one penalty on each team", () => {
		it("15 yard penalty overrules 5 yard penalty", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 2;
			game.toGo = 7;
			game.scrimmage = 35;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("pass");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "dropback",
			});
			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Taunting",
				penYds: 15,
				spotYds: 4,
				t: game.o,
			});
			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: true,
				name: "Holding",
				penYds: 5,
				spotYds: undefined,
				t: game.d,
			});
			play.addEvent({
				type: "pss",
				qb: p,
				target: p,
			});
			play.addEvent({
				type: "pssCmp",
				qb: p,
				target: p,
				yds: 4,
			});

			assert.strictEqual(
				play.state.current.scrimmage,
				39,
				"before penalty application",
			);

			play.commit();

			assert.strictEqual(play.state.current.down, 2);
			assert.strictEqual(play.state.current.toGo, 18);
			assert.strictEqual(play.state.current.scrimmage, 24);
		});

		it("two penalties after change of possession -> roll back to change of possession", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.awaitingKickoff = 0;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("kickoff");
			const po = game.pickPlayer(game.o);
			const pd = game.pickPlayer(game.d);

			const play = game.currentPlay;

			play.addEvent({
				type: "k",
				kickTo: 40,
			});
			play.addEvent({
				type: "possessionChange",
				yds: 0,
				kickoff: true,
			});

			assert.strictEqual(play.state.current.scrimmage, 40, "before return");

			play.addEvent({
				type: "penalty",
				p: po,
				automaticFirstDown: false,
				name: "Holding",
				penYds: 10,
				spotYds: -3,
				t: game.o,
			});
			play.addEvent({
				type: "penalty",
				p: pd,
				automaticFirstDown: true,
				name: "Holding",
				penYds: 5,
				spotYds: undefined,
				t: game.d,
			});
			play.addEvent({
				type: "kr",
				p: pd,
				yds: 10,
			});

			assert.strictEqual(
				play.state.current.scrimmage,
				50,
				"before penalty application",
			);

			play.commit();

			assert.strictEqual(
				play.state.current.scrimmage,
				40,
				"after penalty application",
			);

			assert.strictEqual(
				game.awaitingKickoff,
				undefined,
				"awaitingKickoff is persisted",
			);
		});

		it("penalty on offense, change of possession, penalty on new offense -> apply only 2nd penalty", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.awaitingKickoff = 0;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("kickoff");
			const po = game.pickPlayer(game.o);
			const pd = game.pickPlayer(game.d);

			const play = game.currentPlay;

			play.addEvent({
				type: "penalty",
				p: po,
				automaticFirstDown: false,
				name: "Holding",
				penYds: 10,
				spotYds: -3,
				t: game.o,
			});

			play.addEvent({
				type: "k",
				kickTo: 40,
			});
			play.addEvent({
				type: "possessionChange",
				yds: 0,
				kickoff: true,
			});

			assert.strictEqual(play.state.current.scrimmage, 40, "before return");

			play.addEvent({
				type: "penalty",
				p: pd,
				automaticFirstDown: true,
				name: "Holding",
				penYds: 5,
				spotYds: 0,
				t: game.d,
			});
			play.addEvent({
				type: "kr",
				p: pd,
				yds: 10,
			});

			assert.strictEqual(
				play.state.current.scrimmage,
				50,
				"before penalty application",
			);

			play.commit();

			assert.strictEqual(
				play.state.current.scrimmage,
				35,
				"after penalty application",
			);

			assert.strictEqual(
				game.awaitingKickoff,
				undefined,
				"awaitingKickoff is persisted",
			);

			assert.strictEqual(game.o, 1, "possession change happened");
		});

		it("no special case -> replay down", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 2;
			game.toGo = 7;
			game.scrimmage = 25;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("pass");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "dropback",
			});
			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Holding",
				penYds: 10,
				spotYds: -3,
				t: game.o,
			});
			play.addEvent({
				type: "penalty",
				p,
				automaticFirstDown: true,
				name: "Holding",
				penYds: 5,
				spotYds: undefined,
				t: game.d,
			});
			play.addEvent({
				type: "pss",
				qb: p,
				target: p,
			});
			play.addEvent({
				type: "pssCmp",
				qb: p,
				target: p,
				yds: 21,
			});

			assert.strictEqual(
				play.state.current.scrimmage,
				46,
				"before penalty application",
			);

			play.commit();

			assert.strictEqual(play.state.current.down, 2);
			assert.strictEqual(play.state.current.toGo, 7);
			assert.strictEqual(play.state.current.scrimmage, 25);
		});
	});

	describe("game sim issues", () => {
		it("missed fg -> possesion change", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 2;
			game.toGo = 7;
			game.scrimmage = 63;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("fieldGoal");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "fg",
				p,
				made: false,
				distance: 54,
				late: false,
			});

			play.commit();

			assert.strictEqual(play.state.current.o, 1);
			assert.strictEqual(play.state.current.down, 1);
			assert.strictEqual(play.state.current.toGo, 10);
			assert.strictEqual(play.state.current.scrimmage, 44);
		});

		it("run -> fumble recovered by offense -> lost down", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 2;
			game.toGo = 7;
			game.scrimmage = 63;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("fieldGoal");
			const pFumbled = game.pickPlayer(game.o);
			const pForced = game.pickPlayer(game.d);

			const play = game.currentPlay;

			play.addEvent({
				type: "rus",
				p: pFumbled,
				yds: 2,
			});
			play.addEvent({
				type: "fmb",
				pFumbled,
				pForced,
				yds: 1,
			});
			play.addEvent({
				type: "fmbRec",
				pFumbled,
				pRecovered: pFumbled,
				yds: 1,
				lost: false,
			});

			play.commit();

			assert.strictEqual(play.state.current.down, 3);
			assert.strictEqual(play.state.current.toGo, 3);
			assert.strictEqual(play.state.current.scrimmage, 67);
		});

		it("pass -> fumble recovered by offense -> lost down", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 2;
			game.toGo = 7;
			game.scrimmage = 63;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("fieldGoal");
			const pFumbled = game.pickPlayer(game.o);
			const pForced = game.pickPlayer(game.d);

			const play = game.currentPlay;

			play.addEvent({
				type: "dropback",
			});
			play.addEvent({
				type: "fmb",
				pFumbled,
				pForced,
				yds: 1,
			});
			play.addEvent({
				type: "fmbRec",
				pFumbled,
				pRecovered: pFumbled,
				yds: 1,
				lost: false,
			});

			play.commit();

			assert.strictEqual(play.state.current.down, 3);
			assert.strictEqual(play.state.current.toGo, 5);
			assert.strictEqual(play.state.current.scrimmage, 65);
		});

		it("QB scramble counts as one down", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 2;
			game.toGo = 7;
			game.scrimmage = 63;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("fieldGoal");
			const p = game.pickPlayer(game.o);

			const play = game.currentPlay;

			play.addEvent({
				type: "dropback",
			});
			play.addEvent({
				type: "rus",
				p,
				yds: 2,
			});

			play.commit();

			assert.strictEqual(play.state.current.down, 3);
			assert.strictEqual(play.state.current.toGo, 5);
			assert.strictEqual(play.state.current.scrimmage, 65);
		});
	});
});
