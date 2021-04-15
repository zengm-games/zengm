import assert from "assert";
import testHelpers from "../../../test/helpers";
import { g } from "../../util";
import { createWithoutSaving } from "./create";
import type { ThenArg } from "../../../common/types";

describe("worker/core/league/create", () => {
	let leagueData: ThenArg<ReturnType<typeof createWithoutSaving>>;
	beforeAll(async () => {
		leagueData = await createWithoutSaving(0, { startingSeason: 2015 }, false);
	});

	test("create all necessary object stores", () => {
		assert.deepStrictEqual(Object.keys(leagueData).sort(), [
			"allStars",
			"awards",
			"draftLotteryResults",
			"draftPicks",
			"events",
			"gameAttributes",
			"games",
			"headToHeads",
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
		assert.strictEqual(leagueData.gameAttributes.phase, 0);
		assert.strictEqual(
			leagueData.gameAttributes.season,
			leagueData.gameAttributes.startingSeason,
		);
		assert.deepStrictEqual(leagueData.gameAttributes.userTid, [
			{ start: -Infinity, value: 0 },
		]);
		assert.strictEqual(leagueData.gameAttributes.gameOver, false);
		assert.strictEqual(leagueData.gameAttributes.daysLeft, 0);
	});

	test("initialize teams object store", async () => {
		const cids = leagueData.teams.map((t: { cid: number }) => t.cid);
		const dids = leagueData.teams.map((t: { did: number }) => t.did);
		assert.strictEqual(leagueData.teams.length, g.get("numActiveTeams"));
		assert.strictEqual(leagueData.teams.length, g.get("numTeams"));

		for (let i = 0; i < 2; i++) {
			assert.strictEqual(testHelpers.numInArrayEqualTo(cids, i), 15);
		}

		for (let i = 0; i < 6; i++) {
			assert.strictEqual(testHelpers.numInArrayEqualTo(dids, i), 5);
		}

		for (const t of leagueData.teams) {
			assert.strictEqual(typeof t.name, "string");
			assert.strictEqual(typeof t.region, "string");
			assert.strictEqual(typeof t.tid, "number");

			for (const key of Object.keys(t.budget)) {
				assert(t.budget[key].amount > 0);
			}
		}
	});

	test("initialize teamSeasons object store", async () => {
		assert.strictEqual(leagueData.teamSeasons.length, g.get("numActiveTeams"));
	});

	test("lazily initialize teamStats object store", async () => {
		assert.strictEqual(leagueData.teamStats.length, 0);
	});

	test("initialize trade object store", async () => {
		assert.strictEqual(leagueData.trade.length, 1);
		assert.strictEqual(leagueData.trade[0].rid, 0);
		assert.strictEqual(leagueData.trade[0].teams.length, 2);
	});

	test("initialize players object store", async () => {
		assert.strictEqual(leagueData.players.length, 30 * 13 + 150 + 70 * 3);
	});

	test("no error with restricted draftAges and forceRetireAge settings", async () => {
		const leagueData = await createWithoutSaving(
			0,
			{
				startingSeason: 2021,
				gameAttributes: {
					draftAges: [19, 19],
					forceRetireAge: 20,
				},
			},
			false,
		);

		assert(leagueData);
	});
});
