// @flow

import assert from "assert";
import testHelpers from "../../../test/helpers";
import { g } from "../../util";
import { createWithoutSaving } from "./create";

describe("worker/core/league/create", () => {
	let leagueData;
	beforeAll(() => {
		leagueData = createWithoutSaving("Test", 0, {}, 2015, false, 0);
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
		assert.equal(leagueData.gameAttributes.userTid, 0);
		assert.equal(leagueData.gameAttributes.gameOver, false);
		assert.equal(leagueData.gameAttributes.daysLeft, 0);

		assert.equal(Object.keys(leagueData.gameAttributes).length, 50);
	});

	test("initialize teams object store", async () => {
		const cids = leagueData.teams.map(t => t.cid);
		const dids = leagueData.teams.map(t => t.did);

		assert.equal(leagueData.teams.length, g.numTeams);
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
		assert.equal(leagueData.teamSeasons.length, g.numTeams);
	});

	test("initialize teamStats object store", async () => {
		assert.equal(leagueData.teamStats.length, g.numTeams);
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
