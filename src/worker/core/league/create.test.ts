import assert from "assert";
import testHelpers from "../../../test/helpers";
import { g } from "../../util";
import { createWithoutSaving } from "./create";
import type { ThenArg } from "../../../common/types";
import { PHASE } from "../../../common";

describe("worker/core/league/create", () => {
	describe("One example", () => {
		let leagueData: ThenArg<ReturnType<typeof createWithoutSaving>>;
		beforeAll(async () => {
			leagueData = await createWithoutSaving(
				"Test",
				0,
				{ startingSeason: 2015 },
				false,
				0,
			);
		});

		test("create all necessary object stores", () => {
			assert.deepEqual(Object.keys(leagueData).sort(), [
				"allStars",
				"awards",
				"draftLotteryResults",
				"draftPicks",
				"events",
				"gameAttributes",
				"games",
				"messages",
				"negotiations",
				"playerFeats",
				"players",
				"playoffSeries",
				"releasedPlayers",
				"schedule",
				"scheduledEvents",
				"teamSeasons",
				"teamStats",
				"teams",
				"trade",
			]);
		});

		test("initialize gameAttributes object store", async () => {
			assert.equal(leagueData.gameAttributes.leagueName, "Test");
			assert.equal(leagueData.gameAttributes.phase, 0);
			assert.equal(
				leagueData.gameAttributes.season,
				leagueData.gameAttributes.startingSeason,
			);
			assert.deepEqual(leagueData.gameAttributes.userTid, [
				{ start: -Infinity, value: 0 },
			]);
			assert.equal(leagueData.gameAttributes.gameOver, false);
			assert.equal(leagueData.gameAttributes.daysLeft, 0);
			assert.equal(Object.keys(leagueData.gameAttributes).length, 73);
		});

		test("initialize teams object store", async () => {
			const cids = leagueData.teams.map((t: { cid: number }) => t.cid);
			const dids = leagueData.teams.map((t: { did: number }) => t.did);
			assert.equal(leagueData.teams.length, g.get("numActiveTeams"));
			assert.equal(leagueData.teams.length, g.get("numTeams"));

			for (let i = 0; i < 2; i++) {
				assert.equal(testHelpers.numInArrayEqualTo(cids, i), 15);
			}

			for (let i = 0; i < 6; i++) {
				assert.equal(testHelpers.numInArrayEqualTo(dids, i), 5);
			}

			for (const t of leagueData.teams) {
				assert.equal(typeof t.name, "string");
				assert.equal(typeof t.region, "string");
				assert.equal(typeof t.tid, "number");

				for (const key of Object.keys(t.budget)) {
					assert(t.budget[key].amount > 0);
				}
			}
		});

		test("initialize teamSeasons object store", async () => {
			assert.equal(leagueData.teamSeasons.length, g.get("numActiveTeams"));
		});

		test("initialize teamStats object store", async () => {
			assert.equal(leagueData.teamStats.length, g.get("numActiveTeams"));
		});

		test("initialize trade object store", async () => {
			assert.equal(leagueData.trade.length, 1);
			assert.equal(leagueData.trade[0].rid, 0);
			assert.equal(leagueData.trade[0].teams.length, 2);
		});

		test("initialize players object store", async () => {
			assert.equal(leagueData.players.length, 30 * 13 + 150 + 70 * 3);
		});
	});

	// Would be nice to have these tests more isolated, otherwise this is pretty slow
	describe("userTid", () => {
		test("save integer in wrapped format", async () => {
			const leagueData = await createWithoutSaving(
				"Test",
				5,
				{ startingSeason: 2015 },
				false,
				0,
			);

			assert.deepEqual(leagueData.gameAttributes.userTid, [
				{ start: -Infinity, value: 5 },
			]);
		});

		test("maintain history", async () => {
			const leagueData = await createWithoutSaving(
				"Test",
				5,
				{
					startingSeason: 2015,
					gameAttributes: [
						{ key: "startingSeason", value: 2010 },
						{
							key: "userTid",
							value: [
								{ start: -Infinity, value: 3 },
								{ start: 2013, value: 5 },
							],
						},
					],
				},
				false,
				0,
			);

			assert.deepEqual(leagueData.gameAttributes.userTid, [
				{ start: -Infinity, value: 3 },
				{ start: 2013, value: 5 },
			]);
		});

		test("maintain history while selecting a new team", async () => {
			const leagueData = await createWithoutSaving(
				"Test",
				5,
				{
					startingSeason: 2015,
					gameAttributes: [
						{ key: "startingSeason", value: 2010 },
						{
							key: "userTid",
							value: [
								{ start: -Infinity, value: 3 },
								{ start: 2013, value: 4 },
							],
						},
					],
				},
				false,
				0,
			);

			assert.deepEqual(leagueData.gameAttributes.userTid, [
				{ start: -Infinity, value: 3 },
				{ start: 2013, value: 4 },
				{ start: 2015, value: 5 },
			]);
		});

		test("maintain history while selecting a new team, overwriting current season", async () => {
			const leagueData = await createWithoutSaving(
				"Test",
				5,
				{
					startingSeason: 2015,
					gameAttributes: [
						{ key: "startingSeason", value: 2010 },
						{
							key: "userTid",
							value: [
								{ start: -Infinity, value: 3 },
								{ start: 2015, value: 4 },
							],
						},
					],
				},
				false,
				0,
			);

			assert.deepEqual(leagueData.gameAttributes.userTid, [
				{ start: -Infinity, value: 3 },
				{ start: 2015, value: 5 },
			]);
		});

		test("new team after playoffs", async () => {
			const leagueData = await createWithoutSaving(
				"Test",
				5,
				{
					startingSeason: 2015,
					gameAttributes: [
						{ key: "startingSeason", value: 2010 },
						{ key: "phase", value: PHASE.DRAFT },
						{
							key: "userTid",
							value: [
								{ start: -Infinity, value: 3 },
								{ start: 2015, value: 4 },
							],
						},
					],
				},
				false,
				0,
			);

			assert.deepEqual(leagueData.gameAttributes.userTid, [
				{ start: -Infinity, value: 3 },
				{ start: 2015, value: 4 },
				{ start: 2016, value: 5 },
			]);
		});
	});
});
