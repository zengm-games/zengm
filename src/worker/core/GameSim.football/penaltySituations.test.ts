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
		test.skip("punt, penalty on return team -> confirm possession change reverted and penalty yardage applied correctly", async () => {
			const game = await initGameSim();
			game.o = 0;
			game.d = 1;
			game.down = 4;
			game.toGo = 10;
			game.scrimmage = 20;
			game.currentPlay = new Play(game);

			game.updatePlayersOnField("punt");
			const punter = game.getTopPlayerOnField(game.o, "P");
			const puntReturner = game.getTopPlayerOnField(game.d, "PR");

			const play = game.currentPlay;
			const distance = 50;
			play.addEvent({
				type: "p",
				p: punter,
				yds: distance,
			});
		});

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

			assert.strictEqual(
				play.state.current.scrimmage,
				9,
				"after penalty application",
			);
		});
	});
});
