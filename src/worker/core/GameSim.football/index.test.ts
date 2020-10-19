import range from "lodash/range";
import assert from "assert";
import GameSim from ".";
import { player, team } from "..";
import loadTeams from "../game/loadTeams";
import { g, helpers } from "../../util";
import testHelpers from "../../../test/helpers";

const genTwoTeams = async () => {
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

const simGame = async () => {
	const teams = await loadTeams([0, 1]);
	for (const t of [teams[0], teams[1]]) {
		if (t.depth !== undefined) {
			t.depth = team.getDepthPlayers(t.depth, t.player);
		}
	}
	return new GameSim(0, [teams[0], teams[1]], false);
};

describe("worker/core/GameSim.football", () => {
	beforeAll(async () => {
		await genTwoTeams();
	});

	test("kick a field goal when down 2 at the end of the game and there is little time left", async () => {
		const game = await simGame();

		// Down by 2, 4th quarter, ball on the opp 20 yard line, 6 seconds left
		game.awaitingKickoff = undefined;
		game.o = 0;
		game.d = 1;
		game.team[0].stat.ptsQtrs = [0, 0, 0, 0];
		game.team[1].stat.ptsQtrs = [0, 0, 0, 2];
		game.scrimmage = 80;
		game.clock = 0.01;
		assert.strictEqual(game.getPlayType(), "fieldGoal");
	});

	test("kick a field goal at the end of the 2nd quarter rather than running out the clock", async () => {
		const game = await simGame();

		// Arbitrary score, 2nd quarter, ball on the opp 20 yard line, 6 seconds left
		game.awaitingKickoff = undefined;
		game.o = 0;
		game.d = 1;
		game.team[0].stat.ptsQtrs = [0, Math.round(Math.random() * 100)];
		game.team[1].stat.ptsQtrs = [0, Math.round(Math.random() * 100)];
		game.scrimmage = 80;
		game.clock = 0.01;
		assert.strictEqual(game.getPlayType(), "fieldGoal");
	});
});
