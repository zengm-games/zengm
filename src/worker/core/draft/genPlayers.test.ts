import assert from "assert";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { idb } from "../../db";
import { g } from "../../util";
import { draft } from "..";

describe("worker/core/draft/genPlayers", () => {
	test("generate 70 players for the draft", async () => {
		testHelpers.resetG();
		await testHelpers.resetCache();
		idb.league = testHelpers.mockIDBLeague();
		await draft.genPlayers(g.get("season"), 15.5);
		const players = await idb.cache.players.indexGetAll(
			"playersByDraftYearRetiredYear",
			[[g.get("season")], [g.get("season"), Infinity]],
		);
		assert.strictEqual(players.length, 70); // 70 players in a draft class

		for (const p of players) {
			assert.strictEqual(p.tid, PLAYER.UNDRAFTED);
		}

		// @ts-ignore
		idb.league = undefined;
	});
});
