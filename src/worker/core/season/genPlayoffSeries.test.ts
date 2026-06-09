import {
	afterAll,
	assert,
	beforeAll,
	beforeEach,
	describe,
	test,
} from "vitest";
import { g, helpers } from "../../util/index.ts";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { makeMatchups } from "./genPlayoffSeries.ts";
import { idb } from "../../db/index.ts";
import { PHASE } from "../../../common/constants.ts";
import type { PlayoffSeries } from "../../../common/types.ts";
import newSchedulePlayoffsDay from "./newSchedulePlayoffsDay.ts";
import {
	betterSeedHome,
	deleteScheduledGamesForCompletedSeries,
} from "./playoffSchedule.ts";
import api from "../../api/index.ts";
import team from "../team/index.ts";

const makeMatchupsWrapper = (
	teams: { tid: number; cid: number }[],
	numPlayoffSeries: number,
	numPlayoffByes: number,
) => {
	const { round: series } = makeMatchups(
		teams.map((t) => {
			return {
				tid: t.tid,

				seasonAttrs: {
					cid: t.cid,
					// This doesn't affect order - sorting is done before calling genPlayoffSeries
					winp: 0,
				},
			};
		}),
		numPlayoffSeries,
		numPlayoffByes,
	);

	const tidPlayoffs = [];
	for (const matchup of series) {
		tidPlayoffs.push(matchup.home.tid);
		if (matchup.away !== undefined) {
			tidPlayoffs.push(matchup.away.tid);
		}
	}
	tidPlayoffs.sort();

	return {
		series,
		tidPlayoffs,
	};
};

beforeAll(() => {
	resetG();
	g.setWithoutSavingToDB("playIn", false);
});
afterAll(() => {
	resetG();
});

// makeMatchups is now called separately per conference, so this test would need to be refactored to call genPlayoffSeriesFromTeams, which is a little more complicated because it calls orderTeams
test.skip("split teams by conference if there are two conferences", () => {
	const teams = [
		{
			tid: 0,
			cid: 0,
		},
		{
			tid: 2,
			cid: 0,
		},
		{
			tid: 3,
			cid: 0,
		},
		{
			tid: 6,
			cid: 0,
		},
		{
			tid: 5,
			cid: 1,
		},
		{
			tid: 1,
			cid: 1,
		},
		{
			tid: 4,
			cid: 1,
		},
	];
	g.setWithoutSavingToDB("confs", [
		{
			cid: 0,
			name: "Eastern Conference",
		},
		{
			cid: 1,
			name: "Western Conference",
		},
	]);
	g.setWithoutSavingToDB("numGamesPlayoffSeries", [7, 7]);
	g.setWithoutSavingToDB("numPlayoffByes", 0);
	const { series, tidPlayoffs } = makeMatchupsWrapper(teams, 4, 0);
	assert.deepStrictEqual(tidPlayoffs, [0, 1, 2, 5]);
	assert.strictEqual(series.length, 2);
});

test("pick teams regardless of conference if there are not two conferences", () => {
	const teams = [
		{
			tid: 0,
			cid: 0,
		},
		{
			tid: 2,
			cid: 0,
		},
		{
			tid: 3,
			cid: 2,
		},
		{
			tid: 6,
			cid: 0,
		},
		{
			tid: 5,
			cid: 1,
		},
		{
			tid: 1,
			cid: 1,
		},
		{
			tid: 4,
			cid: 1,
		},
	];
	g.setWithoutSavingToDB("confs", [
		{
			cid: 0,
			name: "Eastern Conference",
		},
		{
			cid: 1,
			name: "Western Conference",
		},
		{
			cid: 2,
			name: "Whatever",
		},
	]);
	g.setWithoutSavingToDB("numGamesPlayoffSeries", [7, 7]);
	g.setWithoutSavingToDB("numPlayoffByes", 0);
	const { series, tidPlayoffs } = makeMatchupsWrapper(teams, 4, 0);
	assert.deepStrictEqual(tidPlayoffs, [0, 2, 3, 6]);
	assert.strictEqual(series.length, 2);
});

// makeMatchups is now called separately per conference, so this test would need to be refactored to call genPlayoffSeriesFromTeams, which is a little more complicated because it calls orderTeams
test.skip("split teams by conference if there are two conferences, including byes", () => {
	const teams = [
		{
			tid: 0,
			cid: 0,
		},
		{
			tid: 2,
			cid: 0,
		},
		{
			tid: 3,
			cid: 0,
		},
		{
			tid: 6,
			cid: 0,
		},
		{
			tid: 5,
			cid: 1,
		},
		{
			tid: 1,
			cid: 1,
		},
		{
			tid: 4,
			cid: 1,
		},
		{
			tid: 7,
			cid: 1,
		},
	];
	g.setWithoutSavingToDB("confs", [
		{
			cid: 0,
			name: "Eastern Conference",
		},
		{
			cid: 1,
			name: "Western Conference",
		},
	]);
	const { series, tidPlayoffs } = makeMatchupsWrapper(teams, 6, 2);
	assert.deepStrictEqual(tidPlayoffs, [0, 1, 2, 3, 4, 5]);
	const tids = [
		[0, undefined],
		[2, 3],
		[5, undefined],
		[1, 4],
	];

	for (const [matchup, { away, home }] of Iterator.zip([tids, series], {
		mode: "strict",
	})) {
		assert.strictEqual(matchup[0], home.tid);

		if (away === undefined) {
			assert.strictEqual(matchup[1], undefined);
		} else {
			assert.strictEqual(matchup[1], away.tid);
		}
	}
});

test("pick teams regardless of conference if there are not two conferences, including byes", () => {
	const teams = [
		{
			tid: 0,
			cid: 0,
		},
		{
			tid: 2,
			cid: 0,
		},
		{
			tid: 3,
			cid: 2,
		},
		{
			tid: 6,
			cid: 0,
		},
		{
			tid: 5,
			cid: 1,
		},
		{
			tid: 1,
			cid: 1,
		},
		{
			tid: 4,
			cid: 1,
		},
		{
			tid: 7,
			cid: 1,
		},
	];
	g.setWithoutSavingToDB("confs", [
		{
			cid: 0,
			name: "Eastern Conference",
		},
		{
			cid: 1,
			name: "Western Conference",
		},
		{
			cid: 2,
			name: "Whatever",
		},
	]);
	const { series, tidPlayoffs } = makeMatchupsWrapper(teams, 6, 2);
	assert.deepStrictEqual(tidPlayoffs, [0, 1, 2, 3, 5, 6]);
	const tids = [
		[0, undefined],
		[6, 5],
		[3, 1],
		[2, undefined],
	];

	for (const [matchup, { away, home }] of Iterator.zip([tids, series], {
		mode: "strict",
	})) {
		assert.strictEqual(matchup[0], home.tid);

		if (away === undefined) {
			assert.strictEqual(matchup[1], undefined);
		} else {
			assert.strictEqual(matchup[1], away.tid);
		}
	}
});

test("handle 16 teams", () => {
	const teams = [
		{
			tid: 0,
			cid: 0,
		},
		{
			tid: 1,
			cid: 0,
		},
		{
			tid: 2,
			cid: 0,
		},
		{
			tid: 3,
			cid: 0,
		},
		{
			tid: 4,
			cid: 0,
		},
		{
			tid: 5,
			cid: 0,
		},
		{
			tid: 6,
			cid: 0,
		},
		{
			tid: 7,
			cid: 0,
		},
		{
			tid: 8,
			cid: 0,
		},
		{
			tid: 9,
			cid: 0,
		},
		{
			tid: 10,
			cid: 0,
		},
		{
			tid: 11,
			cid: 0,
		},
		{
			tid: 12,
			cid: 0,
		},
		{
			tid: 13,
			cid: 0,
		},
		{
			tid: 14,
			cid: 0,
		},
		{
			tid: 15,
			cid: 0,
		},
	];
	g.setWithoutSavingToDB("confs", [
		{
			cid: 0,
			name: "Conference",
		},
	]);
	const { series } = makeMatchupsWrapper(teams, 16, 0);

	// A normal NCAA bracket would swap [2, 13] and [5, 10] but I'm not sure why
	const tids = [
		[0, 15],
		[7, 8],
		[4, 11],
		[3, 12],
		[2, 13],
		[5, 10],
		[6, 9],
		[1, 14],
	];

	for (const [matchup, { away, home }] of Iterator.zip([tids, series], {
		mode: "strict",
	})) {
		assert.strictEqual(matchup[0], home.tid);

		if (away === undefined) {
			assert.strictEqual(matchup[1], undefined);
		} else {
			assert.strictEqual(matchup[1], away.tid);
		}
	}
});

const genTeam = (tid: number, seed: number) => ({
	cid: 0,
	seed,
	tid,
	won: 0,
});

const setupPlayoffScheduleTest = async (
	numGamesPlayoffSeries: number,
): Promise<PlayoffSeries> => {
	resetG();
	g.setWithoutSavingToDB("allStarGame", null);
	g.setWithoutSavingToDB("godMode", true);
	g.setWithoutSavingToDB("numGamesPlayoffSeries", [numGamesPlayoffSeries]);
	g.setWithoutSavingToDB("phase", PHASE.PLAYOFFS);
	g.setWithoutSavingToDB("playoffsByConf", false);
	const teamsDefault = helpers.getTeamsDefault().slice(0, 4);
	await resetCache({
		teams: teamsDefault.map(team.generate),
		teamSeasons: teamsDefault.map((t) => team.genSeasonRow(t)),
	});

	const playoffSeries: PlayoffSeries = {
		currentRound: 0,
		season: g.get("season"),
		series: [
			[
				{
					home: genTeam(0, 1),
					away: genTeam(1, 4),
				},
				{
					home: genTeam(2, 2),
					away: genTeam(3, 3),
				},
			],
		],
	};
	await idb.cache.playoffSeries.put(playoffSeries);

	return playoffSeries;
};

describe("newSchedulePlayoffsDay", () => {
	beforeEach(async () => {
		await resetCache();
	});

	for (const numGamesPlayoffSeries of [4, 5, 7]) {
		test(`pre-generates all games in a ${numGamesPlayoffSeries}-game series`, async () => {
			await setupPlayoffScheduleTest(numGamesPlayoffSeries);

			const playoffsOver = await newSchedulePlayoffsDay();
			assert.strictEqual(playoffsOver, false);

			const schedule = await idb.cache.schedule.getAll();
			assert.strictEqual(schedule.length, 2 * numGamesPlayoffSeries);

			for (let gameNum = 0; gameNum < numGamesPlayoffSeries; gameNum++) {
				const day = gameNum + 1;
				const betterHome = betterSeedHome(numGamesPlayoffSeries, gameNum);

				for (const seriesIndex of [0, 1]) {
					const game = schedule[2 * gameNum + seriesIndex]!;
					assert.strictEqual(game.day, day);

					const homeTid = seriesIndex === 0 ? 0 : 2;
					const awayTid = seriesIndex === 0 ? 1 : 3;
					assert.strictEqual(game.homeTid, betterHome ? homeTid : awayTid);
					assert.strictEqual(game.awayTid, betterHome ? awayTid : homeTid);
				}
			}
		});
	}

	test("regenerates current-round schedule after playoff team edits", async () => {
		await setupPlayoffScheduleTest(7);
		await newSchedulePlayoffsDay();

		await api.main.updatePlayoffTeams([
			{ cid: 0, seed: 1, tid: 0 },
			{ cid: 0, seed: 2, tid: 2 },
			{ cid: 0, seed: 3, tid: 1 },
			{ cid: 0, seed: 4, tid: 3 },
		]);

		const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
		assert.strictEqual(playoffSeries!.series[0]![0]!.away!.tid, 3);
		assert.strictEqual(playoffSeries!.series[0]![1]!.away!.tid, 1);

		const schedule = await idb.cache.schedule.getAll();
		assert.strictEqual(schedule.length, 14);

		for (let gameNum = 0; gameNum < 7; gameNum++) {
			const betterHome = betterSeedHome(7, gameNum);
			const expectedTids = [
				betterHome ? [0, 3] : [3, 0],
				betterHome ? [2, 1] : [1, 2],
			];

			for (const seriesIndex of [0, 1]) {
				const game = schedule[2 * gameNum + seriesIndex]!;
				assert.strictEqual(game.homeTid, expectedTids[seriesIndex]![0]);
				assert.strictEqual(game.awayTid, expectedTids[seriesIndex]![1]);
			}
		}
	});

	test("resumes generated playoff schedule from games already played", async () => {
		const playoffSeries = await setupPlayoffScheduleTest(7);
		playoffSeries.series[0]![0]!.home.won = 2;
		playoffSeries.series[0]![0]!.away!.won = 1;
		playoffSeries.series[0]![1]!.home.won = 1;
		playoffSeries.series[0]![1]!.away!.won = 1;
		await idb.cache.playoffSeries.put(playoffSeries);

		await newSchedulePlayoffsDay();

		const schedule = await idb.cache.schedule.getAll();
		assert.strictEqual(schedule.length, 9);

		const expectedTids: [number, number][] = [];
		for (let gameNum = 0; gameNum < 7; gameNum++) {
			const betterHome = betterSeedHome(7, gameNum);

			if (gameNum >= 3) {
				expectedTids.push(betterHome ? [0, 1] : [1, 0]);
			}

			if (gameNum >= 2) {
				expectedTids.push(betterHome ? [2, 3] : [3, 2]);
			}
		}

		for (const [i, expected] of expectedTids.entries()) {
			assert.strictEqual(schedule[i]!.homeTid, expected[0]);
			assert.strictEqual(schedule[i]!.awayTid, expected[1]);
		}
	});

	test("deletes unplayed surplus games after a series is decided", async () => {
		const playoffSeries = await setupPlayoffScheduleTest(7);
		await newSchedulePlayoffsDay();

		const schedule = await idb.cache.schedule.getAll();
		for (const game of schedule.slice(0, 8)) {
			await idb.cache.schedule.delete(game.gid);
		}

		playoffSeries.series[0]![0]!.home.won = 4;
		playoffSeries.series[0]![1]!.away!.won = 4;
		await idb.cache.playoffSeries.put(playoffSeries);

		const gidsDeleted =
			await deleteScheduledGamesForCompletedSeries(playoffSeries);
		assert.strictEqual(gidsDeleted.length, 6);
		assert.strictEqual((await idb.cache.schedule.getAll()).length, 0);
	});

	test("sets and clears forceWin for all remaining games in a series", async () => {
		await setupPlayoffScheduleTest(5);
		await newSchedulePlayoffsDay();

		await api.main.setForceWinSeries({
			matchupIndex: 0,
			round: 0,
			tid: 1,
		});

		let schedule = await idb.cache.schedule.getAll();
		for (const game of schedule.filter(
			(game) => game.homeTid === 0 || game.awayTid === 0,
		)) {
			assert.strictEqual(game.forceWin, 1);
		}
		for (const game of schedule.filter(
			(game) => game.homeTid === 2 || game.awayTid === 2,
		)) {
			assert.strictEqual(game.forceWin, undefined);
		}

		await api.main.setForceWinSeries({
			matchupIndex: 0,
			round: 0,
		});

		schedule = await idb.cache.schedule.getAll();
		for (const game of schedule) {
			assert.strictEqual(game.forceWin, undefined);
		}
	});
});
