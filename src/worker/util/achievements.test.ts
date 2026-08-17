import { afterAll, assert, beforeAll, describe, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../test/helpers.ts";
import { player, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import g from "./g.ts";
import helpers from "./helpers.ts";
import type { TeamSeason } from "../../common/types.ts";
import {
	defaultAwards,
	defaultAwardsBasketball,
	defaultGameAttributes,
} from "../../common/defaultGameAttributes.ts";
import { DEFAULT_LEVEL } from "../../common/budgetLevels.ts";
import { get, makeAwards } from "./achievementTestHelpers.ts";

describe("checkAchievement", () => {
	beforeAll(async () => {
		resetG();
		g.setWithoutSavingToDB("season", 2013);
		g.setWithoutSavingToDB("userTid", 7);

		const teamsDefault = helpers.getTeamsDefault();
		await resetCache({
			players: [
				player.generate(0, 30, 2010, true, DEFAULT_LEVEL),
				player.generate(0, 30, 2010, true, DEFAULT_LEVEL),
			],
			teams: teamsDefault.map(team.generate),
			teamSeasons: teamsDefault.map((t) => team.genSeasonRow(t)),
		});

		idb.league = mockIDBLeague();
	});
	afterAll(() => {
		// @ts-expect-error
		idb.league = undefined;
	});

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
		test("award achievement if same player wins mvp, finalsMvp, and dpoy, on users team", async () => {
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
