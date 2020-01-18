import assert from "assert";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { draft } from "..";
import { idb } from "../../db";
import { g } from "../../util";
import { getDraftTids, loadTeamSeasons } from "./testHelpers";

const testRunPicks = async (numNow, numTotal) => {
	const pids = await draft.runPicks(false);
	assert.equal(pids.length, numNow);
	const players = (
		await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
			[g.get("season")],
			[g.get("season"), Infinity],
		])
	).filter(p => p.tid === PLAYER.UNDRAFTED);
	assert.equal(players.length, 70 - numTotal);
};

let userPick1;
let userPick2;

const testDraftUser = async round => {
	const draftPicks = await draft.getOrder();
	const dp = draftPicks.shift();
	if (!dp) {
		throw new Error("No draft pick");
	}

	assert.equal(dp.round, round);

	if (round === 1) {
		assert.equal(dp.pick, userPick1);
	} else {
		assert.equal(dp.pick, userPick2 - 30);
	}

	assert.equal(dp.tid, g.get("userTid"));
	const players = (
		await idb.cache.players.indexGetAll("playersByDraftYearRetiredYear", [
			[g.get("season")],
			[g.get("season"), Infinity],
		])
	).filter(p => p.tid === PLAYER.UNDRAFTED);
	const p = players[0];
	await draft.selectPlayer(dp, p.pid);
	assert.equal(p.tid, g.get("userTid"));
};

describe("worker/core/draft/runPicks", () => {
	beforeAll(async () => {
		await loadTeamSeasons();
		idb.league = testHelpers.mockIDBLeague();
		await draft.genPlayers(g.get("season"), 15.5);
		const draftTids = await getDraftTids();
		userPick1 = draftTids.indexOf(g.get("userTid")) + 1;
		userPick2 = draftTids.lastIndexOf(g.get("userTid")) + 1;
	});
	afterAll(() => {
		idb.league = undefined;
	});
	test("draft players before the user's team first round pick", () => {
		return testRunPicks(userPick1 - 1, userPick1 - 1);
	});
	test("then allow the user to draft in the first round", () => {
		return testDraftUser(1);
	});
	test("when called again after the user drafts, should draft players before the user's second round pick comes up", () => {
		return testRunPicks(userPick2 - userPick1 - 1, userPick2 - 1);
	});
	test("then allow the user to draft in the second round", () => {
		return testDraftUser(2);
	});
	test("when called again after the user drafts, should draft more players to finish the draft", () => {
		const numAfter = 60 - userPick2;
		return testRunPicks(numAfter, userPick2 + numAfter);
	});
});
