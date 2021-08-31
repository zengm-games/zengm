import assert from "assert";
import { g } from "../../util";
import testHelpers from "../../../test/helpers";
import { makeMatchups } from "./genPlayoffSeries";

const makeMatchupsWrapper = (
	teams: { tid: number; cid: number }[],
	numPlayoffSeries: number,
	numPlayoffByes: number,
) => {
	const { round: series } = makeMatchups(
		teams.map(t => {
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

describe("worker/core/season/genPlayoffSeries", () => {
	beforeAll(() => {
		testHelpers.resetG();
		g.setWithoutSavingToDB("playIn", false);
	});
	afterAll(() => {
		testHelpers.resetG();
	});

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
		assert.strictEqual(series.length, tids.length);

		for (let i = 0; i < series.length; i++) {
			const { away, home } = series[i];
			assert.strictEqual(tids[i][0], home.tid);

			if (away === undefined) {
				assert.strictEqual(tids[i][1], undefined);
			} else {
				assert.strictEqual(tids[i][1], away.tid);
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
		assert.strictEqual(series.length, tids.length);

		for (let i = 0; i < series.length; i++) {
			const { away, home } = series[i];
			assert.strictEqual(tids[i][0], home.tid);

			if (away === undefined) {
				assert.strictEqual(tids[i][1], undefined);
			} else {
				assert.strictEqual(tids[i][1], away.tid);
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
		assert.strictEqual(series.length, tids.length);

		for (let i = 0; i < series.length; i++) {
			const { away, home } = series[i];
			assert.strictEqual(tids[i][0], home.tid);

			if (away === undefined) {
				assert.strictEqual(tids[i][1], undefined);
			} else {
				assert.strictEqual(tids[i][1], away.tid);
			}
		}
	});
});
