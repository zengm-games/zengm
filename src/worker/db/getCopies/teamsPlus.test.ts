import assert from "assert";
import { assert as typeAssert, IsExact } from "conditional-type-checks";
import testHelpers from "../../../test/helpers";
import { player, team } from "../../core";
import { idb } from "..";
import { g, helpers } from "../../util";

describe("worker/db/getCopies/teamsPlus", () => {
	beforeAll(async () => {
		testHelpers.resetG();
		g.setWithoutSavingToDB("season", 2013);
		const teamsDefault = helpers.getTeamsDefault();
		await testHelpers.resetCache({
			players: [player.generate(4, 30, 2010, true, 15.5)],
			teams: teamsDefault.map(team.generate),
			teamSeasons: teamsDefault.map(t => team.genSeasonRow(t)),
			teamStats: teamsDefault.map(t => team.genStatsRow(t.tid)),
		});

		const teamStats = await idb.cache.teamStats.indexGet(
			"teamStatsByPlayoffsTid",
			[false, 4],
		);

		if (!teamStats) {
			throw new Error("Missing teamStats");
		}

		teamStats.gp = 10;
		teamStats.fg = 50;
		teamStats.fga = 100;
		await idb.cache.teamStats.put(teamStats);
		const teamStats2 = team.genStatsRow(4, true);
		teamStats2.gp = 4;
		teamStats2.fg = 12;
		teamStats2.fga = 120;
		await idb.cache.teamStats.add(teamStats2);
	});

	test("return requested info if tid/season match", async () => {
		const t = await idb.getCopy.teamsPlus({
			attrs: ["tid", "abbrev"],
			seasonAttrs: ["season", "won", "payroll"],
			stats: ["gp", "fg", "fgp"],
			tid: 4,
			season: g.get("season"),
		});

		if (!t) {
			throw new Error("Missing team");
		}

		assert(t.seasonAttrs.payroll > 0);
		assert.deepStrictEqual(t, {
			tid: 4,
			abbrev: "CIN",
			seasonAttrs: {
				season: g.get("season"),
				won: 0,
				payroll: t.seasonAttrs.payroll,
			},
			stats: {
				gp: 10,
				fg: 5,
				fgp: 50,
				playoffs: false,
			},
		});
	});

	test("return an array if no team ID is specified", async () => {
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid", "abbrev"],
			seasonAttrs: ["season", "won"],
			stats: ["gp", "fg", "fgp"],
			season: g.get("season"),
		});
		assert.strictEqual(teams.length, g.get("numTeams"));
		const t = teams[4];
		assert.deepStrictEqual(t, {
			tid: 4,
			abbrev: "CIN",
			seasonAttrs: {
				season: g.get("season"),
				won: 0,
			},
			stats: {
				gp: 10,
				fg: 5,
				fgp: 50,
				playoffs: false,
			},
		});
	});

	test("return requested info if tid/season match, even when no attrs requested", async () => {
		const t = await idb.getCopy.teamsPlus({
			seasonAttrs: ["season", "won"],
			stats: ["gp", "fg", "fgp"],
			tid: 4,
			season: g.get("season"),
		});
		assert.deepStrictEqual(t, {
			seasonAttrs: {
				season: g.get("season"),
				won: 0,
			},
			stats: {
				gp: 10,
				fg: 5,
				fgp: 50,
				playoffs: false,
			},
		});
	});

	test("return requested info if tid/season match, even when no seasonAttrs requested", async () => {
		const t = await idb.getCopy.teamsPlus({
			attrs: ["tid", "abbrev"],
			stats: ["gp", "fg", "fgp"],
			tid: 4,
			season: g.get("season"),
		});
		assert.deepStrictEqual(t, {
			tid: 4,
			abbrev: "CIN",
			stats: {
				gp: 10,
				fg: 5,
				fgp: 50,
				playoffs: false,
			},
		});
	});

	test("return requested info if tid/season match, even when no stats requested", async () => {
		const t = await idb.getCopy.teamsPlus({
			attrs: ["tid", "abbrev"],
			seasonAttrs: ["season", "won"],
			tid: 4,
			season: g.get("season"),
		});
		assert.deepStrictEqual(t, {
			tid: 4,
			abbrev: "CIN",
			seasonAttrs: {
				season: g.get("season"),
				won: 0,
			},
		});
	});

	test("return season totals if statType is 'totals'", async () => {
		const t = await idb.getCopy.teamsPlus({
			stats: ["gp", "fg", "fga", "fgp"],
			tid: 4,
			season: g.get("season"),
			statType: "totals",
		});
		assert.deepStrictEqual(t, {
			stats: {
				gp: 10,
				fg: 50,
				fga: 100,
				fgp: 50,
				playoffs: false,
			},
		});
	});

	test("return playoff stats if playoffs is true", async () => {
		const t = await idb.getCopy.teamsPlus({
			stats: ["gp", "fg", "fga", "fgp"],
			tid: 4,
			season: g.get("season"),
			playoffs: true,
			regularSeason: false,
		});
		assert.deepStrictEqual(t, {
			stats: {
				gp: 4,
				fg: 3,
				fga: 30,
				fgp: 10,
				playoffs: true,
			},
		});
	});

	test("return stats in an array if no season is specified", async () => {
		idb.league = testHelpers.mockIDBLeague();
		const t = await idb.getCopy.teamsPlus({
			stats: ["gp", "fg", "fga", "fgp"],
			tid: 4,
			playoffs: true,
			regularSeason: false,
		});
		// @ts-ignore
		idb.league = undefined;
		assert.deepStrictEqual(t, {
			stats: [
				{
					gp: 4,
					fg: 3,
					fga: 30,
					fgp: 10,
					playoffs: true,
				},
			],
		});
	});

	test("return stats in an array if regular season and playoffs are specified", async () => {
		idb.league = testHelpers.mockIDBLeague();
		const t = await idb.getCopy.teamsPlus({
			stats: ["gp", "fg", "fga", "fgp"],
			tid: 4,
			playoffs: true,
		});
		// @ts-ignore
		idb.league = undefined;
		assert.deepStrictEqual(t, {
			stats: [
				{
					gp: 10,
					fg: 5,
					fga: 10,
					fgp: 50,
					playoffs: false,
				},
				{
					gp: 4,
					fg: 3,
					fga: 30,
					fgp: 10,
					playoffs: true,
				},
			],
		});
	});

	describe("TypeScript", () => {
		test("Returns attrs, seasonAttrs, and stats for a single season", async () => {
			const teams = await idb.getCopies.teamsPlus({
				attrs: ["tid", "abbrev"],
				seasonAttrs: ["season", "won", "payroll"],
				stats: ["gp", "fg", "fgp"],
				season: g.get("season"),
			});

			const t = await idb.getCopy.teamsPlus({
				tid: 0,
				attrs: ["tid", "abbrev"],
				seasonAttrs: ["season", "won", "payroll"],
				stats: ["gp", "fg", "fgp"],
				season: g.get("season"),
			});

			typeAssert<IsExact<typeof teams[number], Exclude<typeof t, undefined>>>(
				true,
			);

			typeAssert<
				IsExact<
					typeof teams[number],
					{
						tid: number;
						abbrev: string;
						seasonAttrs: {
							season: number;
							won: number;
							payroll: number;
						};
						stats: {
							gp: number;
							fg: number;
							fgp: number;
							playoffs: boolean;
						};
					}
				>
			>(true);
		});

		test("Returns just attrs", async () => {
			const teams = await idb.getCopies.teamsPlus({
				attrs: ["tid", "abbrev"],
				season: g.get("season"),
			});

			const t = await idb.getCopy.teamsPlus({
				tid: 0,
				attrs: ["tid", "abbrev"],
				season: g.get("season"),
			});

			typeAssert<IsExact<typeof teams[number], Exclude<typeof t, undefined>>>(
				true,
			);

			typeAssert<
				IsExact<
					typeof teams[number],
					{
						tid: number;
						abbrev: string;
					}
				>
			>(true);
		});

		test("Returns just attrs and seasonAttrs", async () => {
			const teams = await idb.getCopies.teamsPlus({
				attrs: ["tid", "abbrev"],
				seasonAttrs: ["season", "won", "payroll"],
				season: g.get("season"),
			});

			const t = await idb.getCopy.teamsPlus({
				tid: 0,
				attrs: ["tid", "abbrev"],
				seasonAttrs: ["season", "won", "payroll"],
				season: g.get("season"),
			});

			typeAssert<IsExact<typeof teams[number], Exclude<typeof t, undefined>>>(
				true,
			);

			typeAssert<
				IsExact<
					typeof teams[number],
					{
						tid: number;
						abbrev: string;
						seasonAttrs: {
							season: number;
							won: number;
							payroll: number;
						};
					}
				>
			>(true);
		});

		test("Returns just attrs and stats", async () => {
			const teams = await idb.getCopies.teamsPlus({
				attrs: ["tid", "abbrev"],
				stats: ["gp", "fg", "fgp"],
				season: g.get("season"),
			});

			const t = await idb.getCopy.teamsPlus({
				tid: 0,
				attrs: ["tid", "abbrev"],
				stats: ["gp", "fg", "fgp"],
				season: g.get("season"),
			});

			typeAssert<IsExact<typeof teams[number], Exclude<typeof t, undefined>>>(
				true,
			);

			typeAssert<
				IsExact<
					typeof teams[number],
					{
						tid: number;
						abbrev: string;
						stats: {
							gp: number;
							fg: number;
							fgp: number;
							playoffs: boolean;
						};
					}
				>
			>(true);
		});

		test("Returns just seasonAttrs and stats", async () => {
			const teams = await idb.getCopies.teamsPlus({
				seasonAttrs: ["season", "won", "payroll"],
				stats: ["gp", "fg", "fgp"],
				season: g.get("season"),
			});

			const t = await idb.getCopy.teamsPlus({
				tid: 0,
				seasonAttrs: ["season", "won", "payroll"],
				stats: ["gp", "fg", "fgp"],
				season: g.get("season"),
			});

			typeAssert<IsExact<typeof teams[number], Exclude<typeof t, undefined>>>(
				true,
			);

			typeAssert<
				IsExact<
					typeof teams[number],
					{
						seasonAttrs: {
							season: number;
							won: number;
							payroll: number;
						};
						stats: {
							gp: number;
							fg: number;
							fgp: number;
							playoffs: boolean;
						};
					}
				>
			>(true);
		});

		test("Returns array for seasonAttrs and stats when no season is supplied", async () => {
			idb.league = testHelpers.mockIDBLeague();

			const teams = await idb.getCopies.teamsPlus({
				attrs: ["tid", "abbrev"],
				seasonAttrs: ["season", "won", "payroll"],
				stats: ["gp", "fg", "fgp"],
			});

			const t = await idb.getCopy.teamsPlus({
				tid: 0,
				attrs: ["tid", "abbrev"],
				seasonAttrs: ["season", "won", "payroll"],
				stats: ["gp", "fg", "fgp"],
			});

			typeAssert<IsExact<typeof teams[number], Exclude<typeof t, undefined>>>(
				true,
			);

			typeAssert<
				IsExact<
					typeof teams[number],
					{
						tid: number;
						abbrev: string;
						seasonAttrs: {
							season: number;
							won: number;
							payroll: number;
						}[];
						stats: {
							gp: number;
							fg: number;
							fgp: number;
							playoffs: boolean;
						}[];
					}
				>
			>(true);

			// @ts-ignore
			idb.league = undefined;
		});
	});
});
