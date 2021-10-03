import range from "lodash-es/range";
import assert from "assert";
import GameSim from ".";
import { player, team } from "..";
import loadTeams from "../game/loadTeams";
import { g, helpers } from "../../util";
import testHelpers from "../../../test/helpers";
import Play from "./Play";

export const genTwoTeams = async () => {
	testHelpers.resetG();
	g.setWithoutSavingToDB("season", 2013);
	const teamsDefault = helpers.getTeamsDefault().slice(0, 2);
	await testHelpers.resetCache({
		players: [
			...range(50).map(() => player.generate(0, 25, 2010, true, 15.5)),
			...range(50).map(() => player.generate(1, 25, 2010, true, 15.5)),
		],
		teams: teamsDefault.map(team.generate),
		teamSeasons: teamsDefault.map(t => team.genSeasonRow(t)),
		teamStats: teamsDefault.map(t => team.genStatsRow(t.tid)),
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
	});
};

describe("worker/core/GameSim.football", () => {
	beforeAll(async () => {
		await genTwoTeams();
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
		game.currentPlay.commit();

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
		game.currentPlay.commit();

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
});
