import assert from "assert";
import Play from "./Play";
import { genTwoTeams, initGameSim } from "./index.test";

describe("worker/core/GameSim.football", () => {
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

			game.currentPlay.addEvent({
				type: "k",
				kickTo: 40,
			});
			game.currentPlay.addEvent({
				type: "possessionChange",
				yds: 0,
				kickoff: true,
			});

			const play = game.currentPlay;

			assert.strictEqual(play.state.current.scrimmage, 40, "before return");

			play.addEvent({
				type: "penalty",
				p: po,
				automaticFirstDown: true,
				name: "Horse collar tackle",
				penYds: 15,
				spotYds: 4,
				t: game.o,
			});
			game.currentPlay.addEvent({
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

			game.currentPlay.addEvent({
				type: "k",
				kickTo: 40,
			});
			game.currentPlay.addEvent({
				type: "possessionChange",
				yds: 0,
				kickoff: true,
			});

			const play = game.currentPlay;

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
			game.currentPlay.addEvent({
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

		test("accept penalty to block TD", async () => {
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
				type: "penalty",
				p,
				automaticFirstDown: false,
				name: "Holding",
				penYds: 10,
				spotYds: 0,
				t: game.o,
			});

			game.currentPlay.addEvent({
				type: "pss",
				qb,
				target,
			});

			const { td } = game.currentPlay.addEvent({
				type: "pssCmp",
				qb,
				target,
				yds: 100 - game.scrimmage,
			});

			assert.deepStrictEqual(td, true);

			game.currentPlay.addEvent({
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

			game.currentPlay.addEvent({
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

			game.currentPlay.addEvent({
				type: "fg",
				p,
				distance: 30,
				made: true,
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

			game.currentPlay.addEvent({
				type: "fg",
				p,
				distance: 30,
				made: true,
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

			game.currentPlay.addEvent({
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

			game.currentPlay.addEvent({
				type: "rusTD",
				p,
			});

			play.commit();

			assert.deepEqual(game.overtimeState, "firstPossession");
		});
	});
});
