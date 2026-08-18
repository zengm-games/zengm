import { afterAll, assert, beforeAll, describe, test } from "vitest";
import { idb } from "../db/index.ts";
import g from "./g.ts";
import type { TeamSeason } from "../../common/types.ts";
import {
	defaultAwards,
	defaultAwardsBasketball,
	defaultGameAttributes,
} from "../../common/defaultGameAttributes.ts";
import {
	cbAfterAll,
	cbBeforeAll,
	get,
	makeAwards,
} from "./achievementTestHelpers.ts";
import { randInt } from "../../common/random.ts";
import { range } from "../../common/utils.ts";
import { PLAYER } from "../../common/constants.ts";

beforeAll(cbBeforeAll);
afterAll(cbAfterAll);

describe("checkAchievement", () => {
	const addExtraSeasons = async (
		tid: number,
		lastSeason: number,
		extraSeasons: Partial<TeamSeason>[],
	) => {
		for (const extraSeason of extraSeasons) {
			lastSeason += 1;
			extraSeason.tid = tid;
			extraSeason.season = lastSeason;
			// @ts-expect-error
			await idb.cache.teamSeasons.add(extraSeason);
		}
	};

	describe("dynasty*", () => {
		afterAll(async () => {
			const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
				"teamSeasonsByTidSeason",
				[[g.get("userTid")], [g.get("userTid"), "Z"]],
			);
			for (const teamSeason of teamSeasons) {
				if (teamSeason.season > g.get("season")) {
					await idb.cache.teamSeasons.delete(teamSeason.rid);
				}
			}
		});

		test("gracefully handle case where not enough seasons are present", async () => {
			let awarded = await get("dynasty").check();
			assert.strictEqual(awarded, false);

			awarded = await get("dynasty_2").check();
			assert.strictEqual(awarded, false);

			awarded = await get("dynasty_3").check();
			assert.strictEqual(awarded, false);
		});

		test("award dynasty for 6 titles in 8 seasons, but not dynasty_2 or dynasty_3", async () => {
			const extraSeasons = [
				{ playoffRoundsWon: 4 },
				{ playoffRoundsWon: 4 },
				{ playoffRoundsWon: 4 },
				{ playoffRoundsWon: 4 },
				{ playoffRoundsWon: 4 },
				{ playoffRoundsWon: 4 },
			];

			// Add 6 to the existing season, making 7 seasons total
			await addExtraSeasons(g.get("userTid"), g.get("season"), extraSeasons);

			let awarded = await get("dynasty").check();
			assert.strictEqual(awarded, true);

			awarded = await get("dynasty_2").check();
			assert.strictEqual(awarded, false);

			awarded = await get("dynasty_3").check();
			assert.strictEqual(awarded, false);

			// Add 1 to the existing 7 seasons, making 8 seasons total
			await addExtraSeasons(g.get("userTid"), g.get("season") + 6, [
				{ playoffRoundsWon: 3 },
			]);

			awarded = await get("dynasty").check();
			assert.strictEqual(awarded, true);

			awarded = await get("dynasty_2").check();
			assert.strictEqual(awarded, false);

			awarded = await get("dynasty_3").check();
			assert.strictEqual(awarded, false);
		});

		test("award dynasty and dynasty_2 for 8 titles in 8 seasons, but not dynasty_3", async () => {
			// Update non-winning years from last test
			let teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			await idb.cache.teamSeasons.put(teamSeason);

			teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season") + 7],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("dynasty").check();
			assert.strictEqual(awarded, true);

			awarded = await get("dynasty_2").check();
			assert.strictEqual(awarded, true);

			awarded = await get("dynasty_3").check();
			assert.strictEqual(awarded, false);
		});

		test("award dynasty, dynasty_2, and dynasty_3 for 11 titles in 13 seasons if there are 8 contiguous", async () => {
			const extraSeasons = [
				{ playoffRoundsWon: 4 },
				{ playoffRoundsWon: 4 },
				{ playoffRoundsWon: 4 },
				{ playoffRoundsWon: 4 },
				{ playoffRoundsWon: 4 },
			];

			// Add 5 to the existing season, making 13 seasons total
			await addExtraSeasons(
				g.get("userTid"),
				g.get("season") + 7,
				extraSeasons,
			);

			let teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 0;
			await idb.cache.teamSeasons.put(teamSeason);

			teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season") + 1],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 0;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("dynasty").check();
			assert.strictEqual(awarded, true);

			awarded = await get("dynasty_2").check();
			assert.strictEqual(awarded, true);

			awarded = await get("dynasty_3").check();
			assert.strictEqual(awarded, true);
		});

		test("award dynasty and dynasty_3 for 11 titles in 13 seasons, but not dynasty_2 if there are not 8 contiguous", async () => {
			// Swap a couple titles to make no 8 in a row
			let teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			await idb.cache.teamSeasons.put(teamSeason);

			teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season") + 9],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 0;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("dynasty").check();
			assert.strictEqual(awarded, true);

			awarded = await get("dynasty_2").check();
			assert.strictEqual(awarded, false);

			awarded = await get("dynasty_3").check();
			assert.strictEqual(awarded, true);
		});
	});

	describe("moneyball*", () => {
		test("award moneyball and moneyball_2 for title with payroll <= half salary cap", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			teamSeason.expenses.salary = defaultGameAttributes.salaryCap / 2;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("moneyball").check();
			assert.strictEqual(awarded, true);

			awarded = await get("moneyball_2").check();
			assert.strictEqual(awarded, true);
		});

		test("don't award either if didn't win title", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 3;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("moneyball").check();
			assert.strictEqual(awarded, false);

			awarded = await get("moneyball_2").check();
			assert.strictEqual(awarded, false);
		});

		test("award moneyball but not moneyball_2 for title with payroll > half and <= two thirds of the salary cap", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			teamSeason.expenses.salary = 0.66 * defaultGameAttributes.salaryCap;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("moneyball").check();
			assert.strictEqual(awarded, true);

			awarded = await get("moneyball_2").check();
			assert.strictEqual(awarded, false);
		});

		test("don't award either if payroll > two thirds of the salary cap", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			teamSeason.expenses.salary = 0.67 * defaultGameAttributes.salaryCap;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("moneyball").check();
			assert.strictEqual(awarded, false);

			awarded = await get("moneyball_2").check();
			assert.strictEqual(awarded, false);
		});
	});

	describe("small_market", () => {
		test("award achievement if user's team wins title in a small market", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			teamSeason.pop = 1.5;
			await idb.cache.teamSeasons.put(teamSeason);

			const awarded = await get("small_market").check();
			assert.strictEqual(awarded, true);
		});

		test("don't award achievement if user's team is not in a small market", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			teamSeason.pop = 3;
			await idb.cache.teamSeasons.put(teamSeason);

			const awarded = await get("small_market").check();
			assert.strictEqual(awarded, false);
		});

		test("don't award achievement if user's team does not win the title", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 3;
			teamSeason.pop = 1.5;
			await idb.cache.teamSeasons.put(teamSeason);

			const awarded = await get("small_market").check();
			assert.strictEqual(awarded, false);
		});
	});

	describe("homegrown", () => {
		test("award achievement if user's team wins title with players it drafted", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			await idb.cache.teamSeasons.put(teamSeason);

			for (const p of await idb.cache.players.getAll()) {
				p.draft.tid = g.get("userTid");
				p.tid = g.get("userTid");
				await idb.cache.players.put(p);
			}

			const awarded = await get("homegrown").check();
			assert.strictEqual(awarded, true);
		});

		test("don't award achievement if user's team it has another team's drafted player", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			await idb.cache.teamSeasons.put(teamSeason);

			const otherTid = 0;
			const p = (await idb.cache.players.getAll())[0];
			assert(p);
			p.draft.tid = otherTid;
			await idb.cache.players.put(p);

			const awarded = await get("homegrown").check();
			assert.strictEqual(awarded, false);
		});
	});

	describe("golden_oldies", () => {
		test("award achievement if all players are old", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 4;
			await idb.cache.teamSeasons.put(teamSeason);

			for (const p of await idb.cache.players.getAll()) {
				p.tid = g.get("userTid");
				p.draft.year = g.get("season") - 30;
				await idb.cache.players.put(p);
			}

			const awarded = await get("golden_oldies").check();
			assert.strictEqual(awarded, true);

			const awarded2 = await get("golden_oldies_2").check();
			assert.strictEqual(awarded2, false);

			const awarded3 = await get("golden_oldies_3").check();
			assert.strictEqual(awarded3, false);
		});

		test("don't award achievement if user's team didn't win title", async () => {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			);
			assert(teamSeason);
			teamSeason.playoffRoundsWon = 3;
			await idb.cache.teamSeasons.put(teamSeason);

			const awarded = await get("golden_oldies").check();
			assert.strictEqual(awarded, false);
		});
	});

	describe("triple_crown", () => {
		test("award achievement if same player wins mvp, fmvp, and dpoy, on users team", async () => {
			const tid = g.get("userTid");
			const awards = makeAwards({
				season: 2013,
				awards: [
					{
						...defaultAwards.mvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwards.fmvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwardsBasketball.dpoy,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
				],
			});

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, true);
		});

		test("don't award if different players on the same team win the three awards", async () => {
			const tid = g.get("userTid");
			const awards = makeAwards({
				season: 2013,
				awards: [
					{
						...defaultAwards.mvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwards.fmvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwardsBasketball.dpoy,
						group: undefined,
						winner: [{ pid: 1, tid }],
					},
				],
			});

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, false);
		});

		test("dont award if different players win from different teams", async () => {
			const tid = g.get("userTid");
			const awards = makeAwards({
				season: 2013,
				awards: [
					{
						...defaultAwards.mvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwards.fmvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwardsBasketball.dpoy,
						group: undefined,
						winner: [{ pid: 1, tid: tid + 1 }],
					},
				],
			});

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, false);
		});

		test("don't award if same player wins all 3, same team, but not the user's team", async () => {
			const tid = g.get("userTid") + 1;
			const awards = makeAwards({
				season: 2013,
				awards: [
					{
						...defaultAwards.mvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwards.fmvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwardsBasketball.dpoy,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
				],
			});

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, false);
		});

		test("don't award if same player wins but is on different teams (a nonsense scenario)", async () => {
			const tid = g.get("userTid");
			const awards = makeAwards({
				season: 2013,
				awards: [
					{
						...defaultAwards.mvp,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
					{
						...defaultAwards.fmvp,
						group: undefined,
						winner: [{ pid: 0, tid: tid + 1 }],
					},
					{
						...defaultAwardsBasketball.dpoy,
						group: undefined,
						winner: [{ pid: 0, tid }],
					},
				],
			});

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, false);
		});
	});
});

describe("fo_fo_fo", () => {
	test("award achievement for 16-0 playoff record for user's team", async () => {
		// tid 7 wins 4-0 every series
		const ps = {
			season: 2013,
			currentRound: 3,
			series: [
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 16,
							cid: 0,
							winp: 0.47560975609756095,
							won: 0,
							seed: 8,
						},
					},
					{
						home: {
							tid: 1,
							cid: 0,
							winp: 0.6097560975609756,
							won: 4,
							seed: 4,
						},
						away: {
							tid: 15,
							cid: 0,
							winp: 0.5609756097560976,
							won: 1,
							seed: 5,
						},
					},
					{
						home: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 5,
							cid: 0,
							winp: 0.5609756097560976,
							won: 3,
							seed: 6,
						},
					},
					{
						home: {
							tid: 29,
							cid: 0,
							winp: 0.6951219512195121,
							won: 3,
							seed: 2,
						},
						away: {
							tid: 17,
							cid: 0,
							winp: 0.5121951219512195,
							won: 4,
							seed: 7,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 23,
							cid: 1,
							winp: 0.5365853658536586,
							won: 0,
							seed: 8,
						},
					},
					{
						home: {
							tid: 12,
							cid: 1,
							winp: 0.6829268292682927,
							won: 1,
							seed: 4,
						},
						away: {
							tid: 24,
							cid: 1,
							winp: 0.5853658536585366,
							won: 4,
							seed: 5,
						},
					},
					{
						home: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 14,
							cid: 1,
							winp: 0.5853658536585366,
							won: 0,
							seed: 6,
						},
					},
					{
						home: {
							tid: 6,
							cid: 1,
							winp: 0.7439024390243902,
							won: 4,
							seed: 2,
						},
						away: {
							tid: 18,
							cid: 1,
							winp: 0.5487804878048781,
							won: 3,
							seed: 7,
						},
					},
				],
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 1,
							cid: 0,
							winp: 0.6097560975609756,
							won: 0,
							seed: 4,
						},
					},
					{
						home: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 17,
							cid: 0,
							winp: 0.5121951219512195,
							won: 1,
							seed: 7,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 24,
							cid: 1,
							winp: 0.5853658536585366,
							won: 3,
							seed: 5,
						},
					},
					{
						home: {
							tid: 6,
							cid: 1,
							winp: 0.7439024390243902,
							won: 1,
							seed: 2,
						},
						away: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 4,
							seed: 3,
						},
					},
				],
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 0,
							seed: 3,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 2,
							seed: 3,
						},
					},
				],
				[
					{
						home: {
							tid: 4,
							cid: 1,
							winp: 0.8048780487804879,
							won: 0,
							seed: 1,
						},
						away: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
					},
				],
			],
		};

		await idb.cache.playoffSeries.put(ps);
		const awarded = await get("fo_fo_fo").check();
		assert.strictEqual(awarded, true);
	});

	test("don't award achievement for 16-? playoff record for user's team", async () => {
		// tid 7 loses a game!
		const ps = {
			season: 2013,
			currentRound: 3,
			series: [
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 16,
							cid: 0,
							winp: 0.47560975609756095,
							won: 0,
							seed: 8,
						},
					},
					{
						home: {
							tid: 1,
							cid: 0,
							winp: 0.6097560975609756,
							won: 4,
							seed: 4,
						},
						away: {
							tid: 15,
							cid: 0,
							winp: 0.5609756097560976,
							won: 1,
							seed: 5,
						},
					},
					{
						home: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 5,
							cid: 0,
							winp: 0.5609756097560976,
							won: 3,
							seed: 6,
						},
					},
					{
						home: {
							tid: 29,
							cid: 0,
							winp: 0.6951219512195121,
							won: 3,
							seed: 2,
						},
						away: {
							tid: 17,
							cid: 0,
							winp: 0.5121951219512195,
							won: 4,
							seed: 7,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 23,
							cid: 1,
							winp: 0.5365853658536586,
							won: 0,
							seed: 8,
						},
					},
					{
						home: {
							tid: 12,
							cid: 1,
							winp: 0.6829268292682927,
							won: 1,
							seed: 4,
						},
						away: {
							tid: 24,
							cid: 1,
							winp: 0.5853658536585366,
							won: 4,
							seed: 5,
						},
					},
					{
						home: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 14,
							cid: 1,
							winp: 0.5853658536585366,
							won: 0,
							seed: 6,
						},
					},
					{
						home: {
							tid: 6,
							cid: 1,
							winp: 0.7439024390243902,
							won: 4,
							seed: 2,
						},
						away: {
							tid: 18,
							cid: 1,
							winp: 0.5487804878048781,
							won: 3,
							seed: 7,
						},
					},
				],
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 1,
							cid: 0,
							winp: 0.6097560975609756,
							won: 1,
							seed: 4,
						},
					},
					{
						home: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 17,
							cid: 0,
							winp: 0.5121951219512195,
							won: 1,
							seed: 7,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 24,
							cid: 1,
							winp: 0.5853658536585366,
							won: 3,
							seed: 5,
						},
					},
					{
						home: {
							tid: 6,
							cid: 1,
							winp: 0.7439024390243902,
							won: 1,
							seed: 2,
						},
						away: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 4,
							seed: 3,
						},
					},
				],
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 0,
							seed: 3,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 2,
							seed: 3,
						},
					},
				],
				[
					{
						home: {
							tid: 4,
							cid: 1,
							winp: 0.8048780487804879,
							won: 0,
							seed: 1,
						},
						away: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
					},
				],
			],
		};

		await idb.cache.playoffSeries.put(ps);
		const awarded = await get("fo_fo_fo").check();
		assert.strictEqual(awarded, false);
	});

	test("don't award achievement for 16-0 playoff record for other team", async () => {
		// tid 7 is changed to 8
		const ps = {
			season: 2013,
			currentRound: 3,
			series: [
				[
					{
						home: {
							tid: 8,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 16,
							cid: 0,
							winp: 0.47560975609756095,
							won: 0,
							seed: 8,
						},
					},
					{
						home: {
							tid: 1,
							cid: 0,
							winp: 0.6097560975609756,
							won: 4,
							seed: 4,
						},
						away: {
							tid: 15,
							cid: 0,
							winp: 0.5609756097560976,
							won: 1,
							seed: 5,
						},
					},
					{
						home: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 5,
							cid: 0,
							winp: 0.5609756097560976,
							won: 3,
							seed: 6,
						},
					},
					{
						home: {
							tid: 29,
							cid: 0,
							winp: 0.6951219512195121,
							won: 3,
							seed: 2,
						},
						away: {
							tid: 17,
							cid: 0,
							winp: 0.5121951219512195,
							won: 4,
							seed: 7,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 23,
							cid: 1,
							winp: 0.5365853658536586,
							won: 0,
							seed: 8,
						},
					},
					{
						home: {
							tid: 12,
							cid: 1,
							winp: 0.6829268292682927,
							won: 1,
							seed: 4,
						},
						away: {
							tid: 24,
							cid: 1,
							winp: 0.5853658536585366,
							won: 4,
							seed: 5,
						},
					},
					{
						home: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 14,
							cid: 1,
							winp: 0.5853658536585366,
							won: 0,
							seed: 6,
						},
					},
					{
						home: {
							tid: 6,
							cid: 1,
							winp: 0.7439024390243902,
							won: 4,
							seed: 2,
						},
						away: {
							tid: 18,
							cid: 1,
							winp: 0.5487804878048781,
							won: 3,
							seed: 7,
						},
					},
				],
				[
					{
						home: {
							tid: 8,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 1,
							cid: 0,
							winp: 0.6097560975609756,
							won: 1,
							seed: 4,
						},
					},
					{
						home: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 17,
							cid: 0,
							winp: 0.5121951219512195,
							won: 1,
							seed: 7,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 24,
							cid: 1,
							winp: 0.5853658536585366,
							won: 3,
							seed: 5,
						},
					},
					{
						home: {
							tid: 6,
							cid: 1,
							winp: 0.7439024390243902,
							won: 1,
							seed: 2,
						},
						away: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 4,
							seed: 3,
						},
					},
				],
				[
					{
						home: {
							tid: 8,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 0,
							seed: 3,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 2,
							seed: 3,
						},
					},
				],
				[
					{
						home: {
							tid: 4,
							cid: 1,
							winp: 0.8048780487804879,
							won: 0,
							seed: 1,
						},
						away: {
							tid: 8,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
					},
				],
			],
		};

		await idb.cache.playoffSeries.put(ps);
		const awarded = await get("fo_fo_fo").check();
		assert.strictEqual(awarded, false);
	});
});

describe("septuawinarian", () => {
	test("award achievement only if user's team has more than 70 wins", async () => {
		let awarded = await get("septuawinarian").check();
		assert.strictEqual(awarded, false);

		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[g.get("userTid"), g.get("season")],
		);
		assert(teamSeason);
		teamSeason.won = 70;
		await idb.cache.teamSeasons.put(teamSeason);

		awarded = await get("septuawinarian").check();
		assert.strictEqual(awarded, true);
	});
});

describe("98_degrees", () => {
	test("award achievement for 82-0 regular season record and 16-0 playoff record for user's team", async () => {
		// tid 7 wins 4-0 every series
		const ps = {
			season: 2013,
			currentRound: 3,
			series: [
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 16,
							cid: 0,
							winp: 0.47560975609756095,
							won: 0,
							seed: 8,
						},
					},
					{
						home: {
							tid: 1,
							cid: 0,
							winp: 0.6097560975609756,
							won: 4,
							seed: 4,
						},
						away: {
							tid: 15,
							cid: 0,
							winp: 0.5609756097560976,
							won: 1,
							seed: 5,
						},
					},
					{
						home: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 5,
							cid: 0,
							winp: 0.5609756097560976,
							won: 3,
							seed: 6,
						},
					},
					{
						home: {
							tid: 29,
							cid: 0,
							winp: 0.6951219512195121,
							won: 3,
							seed: 2,
						},
						away: {
							tid: 17,
							cid: 0,
							winp: 0.5121951219512195,
							won: 4,
							seed: 7,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 23,
							cid: 1,
							winp: 0.5365853658536586,
							won: 0,
							seed: 8,
						},
					},
					{
						home: {
							tid: 12,
							cid: 1,
							winp: 0.6829268292682927,
							won: 1,
							seed: 4,
						},
						away: {
							tid: 24,
							cid: 1,
							winp: 0.5853658536585366,
							won: 4,
							seed: 5,
						},
					},
					{
						home: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 14,
							cid: 1,
							winp: 0.5853658536585366,
							won: 0,
							seed: 6,
						},
					},
					{
						home: {
							tid: 6,
							cid: 1,
							winp: 0.7439024390243902,
							won: 4,
							seed: 2,
						},
						away: {
							tid: 18,
							cid: 1,
							winp: 0.5487804878048781,
							won: 3,
							seed: 7,
						},
					},
				],
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 1,
							cid: 0,
							winp: 0.6097560975609756,
							won: 0,
							seed: 4,
						},
					},
					{
						home: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 17,
							cid: 0,
							winp: 0.5121951219512195,
							won: 1,
							seed: 7,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 24,
							cid: 1,
							winp: 0.5853658536585366,
							won: 3,
							seed: 5,
						},
					},
					{
						home: {
							tid: 6,
							cid: 1,
							winp: 0.7439024390243902,
							won: 1,
							seed: 2,
						},
						away: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 4,
							seed: 3,
						},
					},
				],
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 0,
							seed: 3,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 2,
							seed: 3,
						},
					},
				],
				[
					{
						home: {
							tid: 4,
							cid: 1,
							winp: 0.8048780487804879,
							won: 0,
							seed: 1,
						},
						away: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
					},
				],
			],
		};

		await idb.cache.playoffSeries.put(ps);
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[g.get("userTid"), g.get("season")],
		);
		assert(teamSeason);
		teamSeason.won = 82;
		teamSeason.lost = 0;
		await idb.cache.teamSeasons.put(teamSeason);

		const awarded = await get("98_degrees").check();
		assert.strictEqual(awarded, true);
	});

	test("don't award achievement without 82-0 regular season", async () => {
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[g.get("userTid"), g.get("season")],
		);
		assert(teamSeason);
		teamSeason.won = 82;
		teamSeason.lost = 1;
		await idb.cache.teamSeasons.put(teamSeason);

		let awarded = await get("98_degrees").check();
		assert.strictEqual(awarded, false);

		teamSeason.won = 81;
		teamSeason.lost = 0;
		await idb.cache.teamSeasons.put(teamSeason);

		awarded = await get("98_degrees").check();
		assert.strictEqual(awarded, false);
	});

	test("don't be awarded without 16-0 playoffs", async () => {
		// tid 7 lost a game
		const ps = {
			season: 2013,
			currentRound: 3,
			series: [
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 16,
							cid: 0,
							winp: 0.47560975609756095,
							won: 1,
							seed: 8,
						},
					},
					{
						home: {
							tid: 1,
							cid: 0,
							winp: 0.6097560975609756,
							won: 4,
							seed: 4,
						},
						away: {
							tid: 15,
							cid: 0,
							winp: 0.5609756097560976,
							won: 1,
							seed: 5,
						},
					},
					{
						home: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 5,
							cid: 0,
							winp: 0.5609756097560976,
							won: 3,
							seed: 6,
						},
					},
					{
						home: {
							tid: 29,
							cid: 0,
							winp: 0.6951219512195121,
							won: 3,
							seed: 2,
						},
						away: {
							tid: 17,
							cid: 0,
							winp: 0.5121951219512195,
							won: 4,
							seed: 7,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 23,
							cid: 1,
							winp: 0.5365853658536586,
							won: 0,
							seed: 8,
						},
					},
					{
						home: {
							tid: 12,
							cid: 1,
							winp: 0.6829268292682927,
							won: 1,
							seed: 4,
						},
						away: {
							tid: 24,
							cid: 1,
							winp: 0.5853658536585366,
							won: 4,
							seed: 5,
						},
					},
					{
						home: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 14,
							cid: 1,
							winp: 0.5853658536585366,
							won: 0,
							seed: 6,
						},
					},
					{
						home: {
							tid: 6,
							cid: 1,
							winp: 0.7439024390243902,
							won: 4,
							seed: 2,
						},
						away: {
							tid: 18,
							cid: 1,
							winp: 0.5487804878048781,
							won: 3,
							seed: 7,
						},
					},
				],
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 1,
							cid: 0,
							winp: 0.6097560975609756,
							won: 0,
							seed: 4,
						},
					},
					{
						home: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 4,
							seed: 3,
						},
						away: {
							tid: 17,
							cid: 0,
							winp: 0.5121951219512195,
							won: 1,
							seed: 7,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 24,
							cid: 1,
							winp: 0.5853658536585366,
							won: 3,
							seed: 5,
						},
					},
					{
						home: {
							tid: 6,
							cid: 1,
							winp: 0.7439024390243902,
							won: 1,
							seed: 2,
						},
						away: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 4,
							seed: 3,
						},
					},
				],
				[
					{
						home: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 26,
							cid: 0,
							winp: 0.6219512195121951,
							won: 0,
							seed: 3,
						},
					},
					{
						home: {
							tid: 11,
							cid: 1,
							winp: 0.8048780487804879,
							won: 4,
							seed: 1,
						},
						away: {
							tid: 20,
							cid: 1,
							winp: 0.7317073170731707,
							won: 2,
							seed: 3,
						},
					},
				],
				[
					{
						home: {
							tid: 4,
							cid: 1,
							winp: 0.8048780487804879,
							won: 0,
							seed: 1,
						},
						away: {
							tid: 7,
							cid: 0,
							winp: 0.7317073170731707,
							won: 4,
							seed: 1,
						},
					},
				],
			],
		};

		await idb.cache.playoffSeries.put(ps);
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[g.get("userTid"), g.get("season")],
		);
		assert(teamSeason);
		teamSeason.won = 82;
		teamSeason.lost = 0;
		await idb.cache.teamSeasons.put(teamSeason);

		const awarded = await get("98_degrees").check();
		assert.strictEqual(awarded, false);
	});
});

describe("hardware_store", () => {
	test("award achievement if user's team sweeps awards", async () => {
		const tid = g.get("userTid");

		const awards = makeAwards({
			season: 2013,
			awards: [
				defaultAwards.mvp,
				defaultAwardsBasketball.dpoy,
				defaultAwardsBasketball.roy,
				defaultAwardsBasketball.smoy,
				defaultAwardsBasketball.mip,
				defaultAwards.fmvp,
			].map((award) => {
				return {
					...award,
					group: undefined,
					winner: [{ pid: randInt(0, 100), tid }],
				};
			}),
		});

		await idb.cache.awards.put(awards);
		const awarded = await get("hardware_store").check();
		assert.strictEqual(awarded, true);
	});

	test("don't award achievement if user's team loses an award", async () => {
		const tid = g.get("userTid");
		const otherTid = tid + 1;

		const awards = makeAwards({
			season: 2013,
			awards: [
				defaultAwards.mvp,
				defaultAwardsBasketball.dpoy,
				defaultAwardsBasketball.roy,
				defaultAwardsBasketball.smoy,
				defaultAwardsBasketball.mip,
				defaultAwards.fmvp,
			].map((award) => {
				return {
					...award,
					group: undefined,
					winner: [
						{
							pid: randInt(0, 100),
							tid: award.shortName === "ROY" ? otherTid : tid,
						},
					],
				};
			}),
		});

		await idb.cache.awards.put(awards);
		const awarded = await get("hardware_store").check();
		assert.strictEqual(awarded, false);
	});

	test("don't award achievement if another team sweeps the awards", async () => {
		const tid = g.get("userTid") + 1;

		const awards = makeAwards({
			season: 2013,
			awards: [
				defaultAwards.mvp,
				defaultAwardsBasketball.dpoy,
				defaultAwardsBasketball.roy,
				defaultAwardsBasketball.smoy,
				defaultAwardsBasketball.mip,
				defaultAwards.fmvp,
			].map((award) => {
				return {
					...award,
					group: undefined,
					winner: [{ pid: randInt(0, 100), tid }],
				};
			}),
		});

		await idb.cache.awards.put(awards);
		const awarded = await get("hardware_store").check();
		assert.strictEqual(awarded, false);
	});
});

describe("sleeper_pick", () => {
	test("award achievement if user's non-lottery pick wins ROY while on user's team", async () => {
		let awarded = await get("sleeper_pick").check();
		assert.strictEqual(awarded, false);

		const p = (await idb.cache.players.getAll())[0];
		assert(p);
		p.tid = g.get("userTid");
		p.draft.tid = g.get("userTid");
		p.draft.round = 1;
		p.draft.pick = 20;
		p.draft.year = g.get("season") - 1;
		await idb.cache.players.put(p);

		// ROY is pid 1 on tid 7
		const awards = makeAwards({
			season: 2013,
			awards: [
				{
					...defaultAwardsBasketball.roy,
					group: undefined,
					winner: [{ pid: p.pid, tid: p.tid }],
				},
			],
		});

		await idb.cache.awards.put(awards);

		awarded = await get("sleeper_pick").check();
		assert.strictEqual(awarded, true);
	});

	test("don't award achievement if not drafted by user", async () => {
		const p = (await idb.cache.players.getAll())[0];
		assert(p);
		p.tid = g.get("userTid");
		p.draft.tid = 15;
		await idb.cache.players.put(p);

		const awarded = await get("sleeper_pick").check();
		assert.strictEqual(awarded, false);
	});

	test("don't award achievement if lottery pick", async () => {
		const p = (await idb.cache.players.getAll())[0];
		assert(p);
		p.draft.tid = g.get("userTid");
		p.draft.pick = 7;
		await idb.cache.players.put(p);

		const awarded = await get("sleeper_pick").check();
		assert.strictEqual(awarded, false);
	});

	test("don't award achievement if old pick", async () => {
		const p = (await idb.cache.players.getAll())[0];
		assert(p);
		p.draft.pick = 15;
		p.draft.year = g.get("season") - 2;
		await idb.cache.players.put(p);

		const awarded = await get("sleeper_pick").check();
		assert.strictEqual(awarded, false);
	});

	test("don't award achievement if not ROY", async () => {
		// Switch to another player
		const p = (await idb.cache.players.getAll())[1];
		assert(p);

		const awards = makeAwards({
			season: 2013,
			awards: [
				{
					...defaultAwardsBasketball.roy,
					group: undefined,
					winner: [{ pid: p.pid, tid: 15 }],
				},
			],
		});
		await idb.cache.awards.put(awards);

		p.draft.year = g.get("season") - 1;
		await idb.cache.players.put(p);

		const awarded = await get("sleeper_pick").check();
		assert.strictEqual(awarded, false);
	});

	test("don't award achievement if not on user's team", async () => {
		const p = (await idb.cache.players.getAll())[0];
		assert(p);
		p.tid = 15;
		p.draft.tid = g.get("userTid");
		p.draft.round = 1;
		p.draft.pick = 20;
		p.draft.year = g.get("season") - 1;
		await idb.cache.players.put(p);

		// ROY is pid 1 on tid 7
		const awards = makeAwards({
			season: 2013,
			awards: [
				{
					...defaultAwardsBasketball.roy,
					group: undefined,
					winner: [{ pid: p.pid, tid: p.tid }],
				},
			],
		});

		await idb.cache.awards.put(awards);

		const awarded = await get("sleeper_pick").check();
		assert.strictEqual(awarded, false);
	});
});

test("brick_wall", async () => {
	const scenarios = [
		{
			text: "2 All-Defensive players -> no award",
			numPlayers: 2,
			awarded: false,
			awarded2: false,
		},
		{
			text: "3 All-Defensive players -> brick_wall",
			numPlayers: 3,
			awarded: true,
			awarded2: false,
		},
		{
			text: "5 All-Defensive players -> brick_wall and brick_wall_2",
			numPlayers: 5,
			awarded: true,
			awarded2: true,
		},
	];

	for (const scenario of scenarios) {
		const awards = makeAwards({
			season: 2013,
			awards: [
				{
					...defaultAwardsBasketball.def,
					group: undefined,
					winner: [
						range(scenario.numPlayers).map(() => ({
							pid: 0,
							tid: g.get("userTid"),
						})),
					],
				},
			],
		});

		await idb.cache.awards.put(awards);

		const awarded = await get("brick_wall").check();
		const awarded2 = await get("brick_wall_2").check();
		assert.deepStrictEqual(
			{ awarded, awarded2 },
			{ awarded: scenario.awarded, awarded2: scenario.awarded2 },
			scenario.text,
		);
	}
});

test("super_team", async () => {
	const scenarios = [
		{
			text: "2 All-League players -> no award",
			numPlayers: 2,
			awarded: false,
		},
		{
			text: "3 All-League players -> super_team",
			numPlayers: 3,
			awarded: true,
		},
	];

	for (const scenario of scenarios) {
		const awards = makeAwards({
			season: 2013,
			awards: [
				{
					...defaultAwards.all,
					group: undefined,
					winner: [
						range(scenario.numPlayers).map(() => ({
							pid: 0,
							tid: g.get("userTid"),
						})),
					],
				},
			],
		});

		await idb.cache.awards.put(awards);

		const awarded = await get("super_team").check();
		assert.strictEqual(awarded, scenario.awarded, scenario.text);
	}
});

test("out_of_nowhere", async () => {
	const scenarios = [
		{
			text: "Just MVP -> no award",
			awards: [defaultAwards.mvp],
			awarded: false,
		},
		{
			text: "Just MIP -> no award",
			awards: [defaultAwardsBasketball.mip],
			awarded: false,
		},
		{
			text: "MVP+MIP -> award",
			awards: [defaultAwards.mvp, defaultAwardsBasketball.mip],
			awarded: true,
		},
	];

	for (const scenario of scenarios) {
		const awards = makeAwards({
			season: 2013,
			awards: scenario.awards.map((award) => {
				return {
					...award,
					group: undefined,
					winner: [{ pid: 0, tid: g.get("userTid") }],
				};
			}),
		});

		await idb.cache.awards.put(awards);

		const awarded = await get("out_of_nowhere").check();
		assert.strictEqual(awarded, scenario.awarded, scenario.text);
	}
});

test("quit_on_top", async () => {
	const scenarios = [
		{
			text: "Just 1st Team -> no award",
			awards: [defaultAwards.all],
			retired: false,
			awarded: false,
		},
		{
			text: "Just retired -> no award",
			awards: [],
			retired: true,
			awarded: false,
		},
		{
			text: "1st team + retired -> award",
			awards: [defaultAwards.all],
			retired: true,
			awarded: true,
		},
	];

	for (const scenario of scenarios) {
		const p = (await idb.cache.players.getAll())[0];
		assert(p);
		if (scenario.retired) {
			p.tid = PLAYER.RETIRED;
			p.retiredYear = g.get("season");
		} else {
			p.tid = g.get("userTid");
			p.retiredYear = Infinity;
		}
		await idb.cache.players.put(p);

		const awards = makeAwards({
			season: 2013,
			awards: scenario.awards.map((award) => {
				return {
					...award,
					group: undefined,
					winner: [[{ pid: 0, tid: g.get("userTid") }]],
				};
			}),
		});

		await idb.cache.awards.put(awards);

		const awarded = await get("quit_on_top").check();
		assert.strictEqual(awarded, scenario.awarded, scenario.text);
	}
});

test("golden_boy", async () => {
	const scenarios = [
		{
			text: "Just 2nd Team -> no award",
			awards: [defaultAwards.all],
			team: 2,
			rookie: false,
			awarded: false,
			awarded2: false,
		},
		{
			text: "Just rookie -> no award",
			awards: [],
			team: 2,
			rookie: true,
			awarded: false,
			awarded2: false,
		},
		{
			text: "2nd team + rookie -> golden_boy",
			awards: [defaultAwards.all],
			team: 2,
			rookie: true,
			awarded: true,
			awarded2: false,
		},
		{
			text: "1nd team + rookie -> golden_boy + golden_boy_2",
			awards: [defaultAwards.all],
			team: 1,
			rookie: true,
			awarded: true,
			awarded2: true,
		},
	];

	for (const scenario of scenarios) {
		const p = (await idb.cache.players.getAll())[0];
		assert(p);
		if (scenario.rookie) {
			p.draft.year = g.get("season") - 1;
		} else {
			p.draft.year = g.get("season") - 2;
		}
		await idb.cache.players.put(p);

		const awards = makeAwards({
			season: 2013,
			awards: scenario.awards.map((award) => {
				const team = [{ pid: 0, tid: g.get("userTid") }];
				return {
					...award,
					group: undefined,
					winner: scenario.team === 1 ? [team] : [[], team],
				};
			}),
		});

		await idb.cache.awards.put(awards);

		const awarded = await get("golden_boy").check();
		assert.strictEqual(awarded, scenario.awarded, scenario.text);

		const awarded2 = await get("golden_boy_2").check();
		assert.strictEqual(awarded2, scenario.awarded2, scenario.text);
	}
});

describe("Edited awards", () => {
	test("name changed -> still valid", async () => {
		const tid = g.get("userTid");

		const awards = makeAwards({
			season: 2013,
			awards: [
				{
					...defaultAwards.mvp,
					name: "Whatever",
				},
				defaultAwardsBasketball.dpoy,
				defaultAwardsBasketball.roy,
				defaultAwardsBasketball.smoy,
				defaultAwardsBasketball.mip,
				defaultAwards.fmvp,
			].map((award) => {
				return {
					...award,
					group: undefined,
					winner: [{ pid: 0, tid }],
				};
			}),
		});

		await idb.cache.awards.put(awards);
		const awarded = await get("hardware_store").check();
		assert.strictEqual(awarded, true);
	});

	test("formula changed -> invalid", async () => {
		const tid = g.get("userTid");

		const awards = makeAwards({
			season: 2013,
			awards: [
				{
					...defaultAwards.mvp,
					formula: "ewa",
				},
				defaultAwardsBasketball.dpoy,
				defaultAwardsBasketball.roy,
				defaultAwardsBasketball.smoy,
				defaultAwardsBasketball.mip,
				defaultAwards.fmvp,
			].map((award) => {
				return {
					...award,
					group: undefined,
					winner: [{ pid: 0, tid }],
				};
			}),
		});

		await idb.cache.awards.put(awards);
		const awarded = await get("hardware_store").check();
		assert.strictEqual(awarded, false);
	});

	test("formulaByPos changed -> invalid", async () => {
		const tid = g.get("userTid");

		const awards = makeAwards({
			season: 2013,
			awards: [
				{
					...defaultAwards.mvp,
					formulaByPos: {
						PG: "ewa",
					},
				},
				defaultAwardsBasketball.dpoy,
				defaultAwardsBasketball.roy,
				defaultAwardsBasketball.smoy,
				defaultAwardsBasketball.mip,
				defaultAwards.fmvp,
			].map((award) => {
				return {
					...award,
					group: undefined,
					winner: [{ pid: 0, tid }],
				};
			}),
		});

		await idb.cache.awards.put(awards);
		const awarded = await get("hardware_store").check();
		assert.strictEqual(awarded, false);
	});

	test("numTeams changed -> invalid", async () => {
		const tid = g.get("userTid");

		const awards = makeAwards({
			season: 2013,
			awards: [
				defaultAwards.mvp,
				defaultAwardsBasketball.dpoy,
				defaultAwardsBasketball.roy,
				defaultAwardsBasketball.smoy,
				defaultAwardsBasketball.mip,
				defaultAwards.fmvp,
			].map((award) => {
				return {
					...award,
					group: undefined,
					winner: [{ pid: 0, tid }],
				};
			}),
		});
		const mvp = awards.awards[0];
		assert(mvp);
		mvp.numTeams = 1;
		mvp.winner = [mvp.winner as any];

		await idb.cache.awards.put(awards);
		const awarded = await get("hardware_store").check();
		assert.strictEqual(awarded, false);
	});

	test("numTeams changed -> still valid, doesn't affect 1st team", async () => {
		const NUM_PLAYERS = 3;

		for (let numTeams = 1; numTeams <= 3; numTeams++) {
			const awards = makeAwards({
				season: 2013,
				awards: [
					{
						...defaultAwardsBasketball.def,
						numTeams,
						group: undefined,
						winner: [
							range(NUM_PLAYERS).map(() => ({
								pid: 0,
								tid: g.get("userTid"),
							})),
						],
					},
				],
			});

			await idb.cache.awards.put(awards);

			assert.strictEqual(await get("brick_wall").check(), true);
		}
	});
});
