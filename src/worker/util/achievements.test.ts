import assert from "assert";
import testHelpers from "../../test/helpers";
import { player, team } from "../core";
import { idb } from "../db";
import g from "./g";
import helpers from "./helpers";
import achievements from "./achievements";
import type { TeamSeason, Achievement } from "../../common/types";

const get = (slug: string) => {
	const achievement = achievements.find(
		achievement2 => slug === achievement2.slug,
	);
	if (!achievement) {
		throw new Error(`No achievement found for slug "${slug}"`);
	}
	if (!achievement.check) {
		throw new Error(`No achievement check found for slug "${slug}"`);
	}
	return achievement as Achievement & {
		check: () => Promise<boolean>;
	};
};

describe("worker/util/account/checkAchievement", () => {
	beforeAll(async () => {
		testHelpers.resetG();
		g.setWithoutSavingToDB("season", 2013);
		g.setWithoutSavingToDB("userTid", 7);

		const teamsDefault = helpers.getTeamsDefault();
		await testHelpers.resetCache({
			players: [
				player.generate(0, 30, 2010, true, 15.5),
				player.generate(0, 30, 2010, true, 15.5),
			],
			teams: teamsDefault.map(team.generate),
			teamSeasons: teamsDefault.map(t => team.genSeasonRow(t)),
		});

		idb.league = testHelpers.mockIDBLeague();
	});
	afterAll(() => {
		// @ts-ignore
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
			// @ts-ignore
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
			let teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 4;
			await idb.cache.teamSeasons.put(teamSeason);

			teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season") + 7],
			)) as TeamSeason;
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

			let teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 0;
			await idb.cache.teamSeasons.put(teamSeason);

			teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season") + 1],
			)) as TeamSeason;
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
			let teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 4;
			await idb.cache.teamSeasons.put(teamSeason);

			teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season") + 9],
			)) as TeamSeason;
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
		test("award moneyball and moneyball_2 for title with payroll <= $45M", async () => {
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 4;
			teamSeason.expenses.salary.amount = 45000;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("moneyball").check();
			assert.strictEqual(awarded, true);

			awarded = await get("moneyball_2").check();
			assert.strictEqual(awarded, true);
		});

		test("don't award either if didn't win title", async () => {
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 3;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("moneyball").check();
			assert.strictEqual(awarded, false);

			awarded = await get("moneyball_2").check();
			assert.strictEqual(awarded, false);
		});

		test("award moneyball but not moneyball_2 for title with payroll > $45M and <= $60M", async () => {
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 4;
			teamSeason.expenses.salary.amount = 60000;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("moneyball").check();
			assert.strictEqual(awarded, true);

			awarded = await get("moneyball_2").check();
			assert.strictEqual(awarded, false);
		});

		test("don't award either if payroll > $40M", async () => {
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 4;
			teamSeason.expenses.salary.amount = 60001;
			await idb.cache.teamSeasons.put(teamSeason);

			let awarded = await get("moneyball").check();
			assert.strictEqual(awarded, false);

			awarded = await get("moneyball_2").check();
			assert.strictEqual(awarded, false);
		});
	});

	describe("small_market", () => {
		test("award achievement if user's team wins title in a small market", async () => {
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 4;
			teamSeason.pop = 1.5;
			await idb.cache.teamSeasons.put(teamSeason);

			const awarded = await get("small_market").check();
			assert.strictEqual(awarded, true);
		});

		test("don't award achievement if user's team is not in a small market", async () => {
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 4;
			teamSeason.pop = 3;
			await idb.cache.teamSeasons.put(teamSeason);

			const awarded = await get("small_market").check();
			assert.strictEqual(awarded, false);
		});

		test("don't award achievement if user's team does not win the title", async () => {
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 3;
			teamSeason.pop = 1.5;
			await idb.cache.teamSeasons.put(teamSeason);

			const awarded = await get("small_market").check();
			assert.strictEqual(awarded, false);
		});
	});

	describe("homegrown", () => {
		test("award achievement if user's team wins title with players it drafted", async () => {
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
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
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 4;
			await idb.cache.teamSeasons.put(teamSeason);

			const otherTid = 0;
			const p = (await idb.cache.players.getAll())[0];
			p.draft.tid = otherTid;
			await idb.cache.players.put(p);

			const awarded = await get("homegrown").check();
			assert.strictEqual(awarded, false);
		});
	});

	describe("golden_oldies", () => {
		test("award achievement if all players are old", async () => {
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
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
			const teamSeason = (await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[g.get("userTid"), g.get("season")],
			)) as TeamSeason;
			teamSeason.playoffRoundsWon = 3;
			await idb.cache.teamSeasons.put(teamSeason);

			const awarded = await get("golden_oldies").check();
			assert.strictEqual(awarded, false);
		});
	});

	describe("triple_crown", () => {
		test("award achievement if same player wins mvp, finalsMvp, and dpoy, on users team", async () => {
			// pid 200 wins mvp, finalsMvp, and dpoy
			const awards = {
				season: 2013,
				roy: {
					pid: 501,
					name: "Timothy Gonzalez",
					tid: 4,
					abbrev: "ATL",
					pts: 30.135135135135137,
					trb: 9.18918918918919,
					ast: 0.7972972972972973,
				},
				mvp: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid"),
					abbrev: "PHI",
					pts: 28.951219512195124,
					trb: 11.329268292682928,
					ast: 0.6585365853658537,
				},
				mip: {
					pid: 280,
					name: "William Jarosz",
					tid: 7,
					abbrev: "PHI",
					pts: 28.951219512195124,
					trb: 11.329268292682928,
					ast: 0.6585365853658537,
				},
				smoy: {
					pid: 505,
					name: "Donald Gallager",
					tid: 7,
					abbrev: "MON",
					pts: 22.195121951219512,
					trb: 7.878048780487805,
					ast: 0.7682926829268293,
				},
				dpoy: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid"),
					abbrev: "PHI",
					trb: 11.329268292682928,
					blk: 3.2560975609756095,
					stl: 2.2804878048780486,
				},
				finalsMvp: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid"),
					abbrev: "PHI",
					pts: 29.3,
					trb: 10.85,
					ast: 3.72,
				},
			};

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, true);
		});

		test("don't award if different players on the same team win the three awards", async () => {
			// pid 200 wins mvp and dpoy, pid 206 wins finalsMvp, all on same team
			const awards = {
				season: 2013,
				roy: {
					pid: 501,
					name: "Timothy Gonzalez",
					tid: 7,
					abbrev: "ATL",
					pts: 30.135135135135137,
					trb: 9.18918918918919,
					ast: 0.7972972972972973,
				},
				mvp: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid"),
					abbrev: "PHI",
					pts: 28.951219512195124,
					trb: 11.329268292682928,
					ast: 0.6585365853658537,
				},
				mip: {
					pid: 280,
					name: "William Jarosz",
					tid: 7,
					abbrev: "PHI",
					pts: 28.951219512195124,
					trb: 11.329268292682928,
					ast: 0.6585365853658537,
				},
				smoy: {
					pid: 505,
					name: "Donald Gallager",
					tid: 7,
					abbrev: "MON",
					pts: 22.195121951219512,
					trb: 7.878048780487805,
					ast: 0.7682926829268293,
				},
				dpoy: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid"),
					abbrev: "PHI",
					trb: 11.329268292682928,
					blk: 3.2560975609756095,
					stl: 2.2804878048780486,
				},
				finalsMvp: {
					pid: 206,
					name: "Vernon Maxwell",
					tid: g.get("userTid"),
					abbrev: "PHI",
					pts: 22.3,
					trb: 7.85,
					ast: 7.72,
				},
			};

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, false);
		});

		test("dont award if different players win from different teams", async () => {
			//pid 200 wins mvp, pid 195 wins dpoy, pid 210 wins finalsMvp, all on diff teams
			const awards = {
				season: 2013,
				roy: {
					pid: 501,
					name: "Timothy Gonzalez",
					tid: 7,
					abbrev: "ATL",
					pts: 30.135135135135137,
					trb: 9.18918918918919,
					ast: 0.7972972972972973,
				},
				mvp: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid"),
					abbrev: "PHI",
					pts: 28.951219512195124,
					trb: 11.329268292682928,
					ast: 0.6585365853658537,
				},
				mip: {
					pid: 280,
					name: "William Jarosz",
					tid: 7,
					abbrev: "PHI",
					pts: 28.951219512195124,
					trb: 11.329268292682928,
					ast: 0.6585365853658537,
				},
				smoy: {
					pid: 505,
					name: "Donald Gallager",
					tid: 7,
					abbrev: "MON",
					pts: 22.195121951219512,
					trb: 7.878048780487805,
					ast: 0.7682926829268293,
				},
				dpoy: {
					pid: 195,
					name: "Shawn Kemp",
					tid: g.get("userTid") + 3,
					abbrev: "SEA",
					trb: 16.329268292682928,
					blk: 1.2560975609756095,
					stl: 4.2804878048780486,
				},
				finalsMvp: {
					pid: 210,
					name: "Michael Jordan",
					tid: g.get("userTid") + 2,
					abbrev: "CHI",
					pts: 35.3,
					trb: 6.85,
					ast: 5.72,
				},
			};

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, false);
		});

		test("don't award if same player wins all 3, same team, but not the user's team", async () => {
			// pid 200 wins mvp, finalsMvp, and dpoy, but on differet teams
			const awards = {
				season: 2013,
				roy: {
					pid: 501,
					name: "Timothy Gonzalez",
					tid: 7,
					abbrev: "ATL",
					pts: 30.135135135135137,
					trb: 9.18918918918919,
					ast: 0.7972972972972973,
				},
				mvp: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid") + 2,
					abbrev: "PHI",
					pts: 28.951219512195124,
					trb: 11.329268292682928,
					ast: 0.6585365853658537,
				},
				mip: {
					pid: 280,
					name: "William Jarosz",
					tid: 7,
					abbrev: "PHI",
					pts: 28.951219512195124,
					trb: 11.329268292682928,
					ast: 0.6585365853658537,
				},
				smoy: {
					pid: 505,
					name: "Donald Gallager",
					tid: 7,
					abbrev: "MON",
					pts: 22.195121951219512,
					trb: 7.878048780487805,
					ast: 0.7682926829268293,
				},
				dpoy: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid") + 2,
					abbrev: "PHI",
					trb: 11.329268292682928,
					blk: 3.2560975609756095,
					stl: 2.2804878048780486,
				},
				finalsMvp: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid") + 2,
					abbrev: "PHI",
					pts: 29.3,
					trb: 10.85,
					ast: 3.72,
				},
			};

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, false);
		});

		test("don't award if same player wins but is on different teams (a nonsense scenario)", async () => {
			// pid 200 wins mvp, finalsMvp, and dpoy, but on differet teams
			const awards = {
				season: 2013,
				roy: {
					pid: 501,
					name: "Timothy Gonzalez",
					tid: 7,
					abbrev: "ATL",
					pts: 30.135135135135137,
					trb: 9.18918918918919,
					ast: 0.7972972972972973,
				},
				mvp: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid"),
					abbrev: "PHI",
					pts: 28.951219512195124,
					trb: 11.329268292682928,
					ast: 0.6585365853658537,
				},
				mip: {
					pid: 280,
					name: "William Jarosz",
					tid: 7,
					abbrev: "PHI",
					pts: 28.951219512195124,
					trb: 11.329268292682928,
					ast: 0.6585365853658537,
				},
				smoy: {
					pid: 505,
					name: "Donald Gallager",
					tid: 7,
					abbrev: "MON",
					pts: 22.195121951219512,
					trb: 7.878048780487805,
					ast: 0.7682926829268293,
				},
				dpoy: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid") + 1,
					abbrev: "SEA",
					trb: 11.329268292682928,
					blk: 3.2560975609756095,
					stl: 2.2804878048780486,
				},
				finalsMvp: {
					pid: 200,
					name: "Hakeem Olajuwon",
					tid: g.get("userTid") + 2,
					abbrev: "HOU",
					pts: 29.3,
					trb: 10.85,
					ast: 3.72,
				},
			};

			await idb.cache.awards.put(awards);
			const awarded = await get("triple_crown").check();
			assert.strictEqual(awarded, false);
		});
	});
});
