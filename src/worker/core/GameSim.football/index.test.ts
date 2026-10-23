import { assert, beforeAll, describe, test } from "vitest";
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

describe("kneel to run out the clock", () => {
	const initKneelSituation = async ({
		down,
		lead,
		oppTimeouts,
		scrimmage = 70,
		seconds,
	}: {
		down: number;
		lead: number;
		oppTimeouts: number;
		scrimmage?: number;
		seconds: number;
	}) => {
		const game = await initGameSim();
		game.awaitingKickoff = undefined;
		game.o = 0;
		game.d = 1;
		game.team[0].stat.pts = lead;
		game.team[0].stat.ptsQtrs = [0, 0, 0, game.team[0].stat.pts];
		game.team[1].stat.pts = 0;
		game.team[1].stat.ptsQtrs = [0, 0, 0, game.team[1].stat.pts];
		game.down = down;
		game.toGo = 10;
		game.scrimmage = scrimmage;
		game.clock = seconds / 60;
		game.timeouts = [3, oppTimeouts];
		game.currentPlay = new Play(game);
		return game;
	};

	test("kneel rather than kick a field goal with a big lead at the end of the game, even if the opponent has timeouts", async () => {
		const game = await initKneelSituation({
			down: 3,
			lead: 27,
			oppTimeouts: 3,
			seconds: 5,
		});

		assert.strictEqual(game.getPlayType(), "kneel");
	});

	test("kneel on 4th down if it will use up the rest of the time", async () => {
		const game = await initKneelSituation({
			down: 4,
			lead: 3,
			oppTimeouts: 0,
			seconds: 1,
		});

		assert.strictEqual(game.getPlayType(), "kneel");
	});

	test("don't kneel on 4th down if there will be time left after a turnover on downs", async () => {
		const game = await initKneelSituation({
			down: 4,
			lead: 3,
			oppTimeouts: 0,
			seconds: 5,
		});

		assert.notStrictEqual(game.getPlayType(), "kneel");
	});

	test("kneel near own end zone if there's only room for the kneels needed to run out the clock", async () => {
		// 2 kneels needed, so 4 kneels worth of room is not necessary
		const game = await initKneelSituation({
			down: 1,
			lead: 3,
			oppTimeouts: 0,
			scrimmage: 8,
			seconds: 60,
		});

		assert.strictEqual(game.getPlayType(), "kneel");
	});
});

describe("go down rather than score a TD to run out the clock", () => {
	const initGoDownSituation = async ({
		lead,
		scrimmage = 70,
		seconds,
		toGo = 10,
	}: {
		lead: number;
		scrimmage?: number;
		seconds: number;
		toGo?: number;
	}) => {
		const game = await initGameSim();
		game.awaitingKickoff = undefined;
		game.o = 0;
		game.d = 1;
		game.team[0].stat.pts = lead;
		game.team[0].stat.ptsQtrs = [0, 0, 0, game.team[0].stat.pts];
		game.team[1].stat.pts = 0;
		game.team[1].stat.ptsQtrs = [0, 0, 0, game.team[1].stat.pts];
		game.down = 1;
		game.toGo = toGo;
		game.scrimmage = scrimmage;
		game.clock = seconds / 60;
		game.timeouts = [0, 0];
		game.currentPlay = new Play(game);
		game.probForgetToGoDown = () => 0;
		return game;
	};

	test("go down a few yards past the first down line if leading and kneeling will run out the clock", async () => {
		const game = await initGoDownSituation({
			lead: 1,
			seconds: 30,
		});

		const yds = game.boundedYdsBallCarrier(100);
		assert(yds >= 13 && yds <= 16, `yds: ${yds}`);
	});

	test("don't change a play that doesn't get past the first down line", async () => {
		const game = await initGoDownSituation({
			lead: 1,
			seconds: 30,
		});

		assert.strictEqual(game.boundedYdsBallCarrier(5), 5);
	});

	test("go down far enough from own end zone to have room to kneel", async () => {
		const game = await initGoDownSituation({
			lead: 1,
			scrimmage: 3,
			seconds: 30,
			toGo: 2,
		});

		assert.strictEqual(game.boundedYdsBallCarrier(100), 17);
	});

	test("go down just short of the goal line if the first down line is close to it", async () => {
		const game = await initGoDownSituation({
			lead: 1,
			scrimmage: 85,
			seconds: 30,
		});

		const yds = game.boundedYdsBallCarrier(100);
		assert(yds >= 13 && yds <= 14, `yds: ${yds}`);
	});

	test("go down at the 1 yard line if it's goal to go", async () => {
		const game = await initGoDownSituation({
			lead: 1,
			scrimmage: 95,
			seconds: 30,
			toGo: 5,
		});

		assert.strictEqual(game.boundedYdsBallCarrier(100), 4);
	});

	test("score if the ball carrier forgets to go down", async () => {
		const game = await initGoDownSituation({
			lead: 1,
			seconds: 30,
		});
		game.probForgetToGoDown = () => 1;

		assert.strictEqual(game.boundedYdsBallCarrier(100), 30);
	});

	test("score if there is too much time left to kneel out the clock", async () => {
		const game = await initGoDownSituation({
			lead: 1,
			seconds: 200,
		});

		assert.strictEqual(game.boundedYdsBallCarrier(100), 30);
	});

	test("score if the lead is big enough that there's no risk", async () => {
		const game = await initGoDownSituation({
			lead: 11,
			seconds: 30,
		});

		assert.strictEqual(game.boundedYdsBallCarrier(100), 30);
	});

	test("score if not leading", async () => {
		const game = await initGoDownSituation({
			lead: 0,
			seconds: 30,
		});

		assert.strictEqual(game.boundedYdsBallCarrier(100), 30);
	});

	test("don't return an interception if leading and kneeling will run out the clock", async () => {
		const game = await initGoDownSituation({
			lead: -1,
			seconds: 30,
		});

		game.currentPlay.addEvent({
			type: "possessionChange",
			subtype: "turnover",
			yds: 0,
		});

		assert.strictEqual(game.boundedYdsBallCarrier(100), 0);
	});

	test("return an interception in the end zone far enough to have room to kneel", async () => {
		const game = await initGoDownSituation({
			lead: -1,
			seconds: 30,
		});

		// Intercepted 5 yards deep in the end zone
		game.currentPlay.addEvent({
			type: "possessionChange",
			subtype: "turnover",
			yds: 35,
		});

		assert.strictEqual(game.boundedYdsBallCarrier(100), 25);
	});
});

test("go for 2 after a touchdown if there is no healthy kicker", async () => {
	const game = await initGameSim();
	game.awaitingKickoff = undefined;
	game.awaitingAfterTouchdown = true;
	game.o = 0;
	game.d = 1;
	game.team[0].stat.ptsQtrs = [6];
	game.team[1].stat.ptsQtrs = [0];
	game.team[0].stat.pts = 6;
	game.team[1].stat.pts = 0;
	for (const p of game.team[0].depth.K) {
		p.injured = true;
	}

	for (let i = 0; i < 20; i++) {
		assert.strictEqual(game.getPlayType(), "twoPointConversion");
	}
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
