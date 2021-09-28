import range from "lodash-es/range";
import assert from "assert";
import GameSim from ".";
import { player, team } from "..";
import loadTeams from "../game/loadTeams";
import { g, helpers } from "../../util";
import testHelpers from "../../../test/helpers";
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
	});
});
