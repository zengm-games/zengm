import assert from "node:assert/strict";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { idb } from "../../db";
import { g } from "../../util";
import { draft } from "..";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels";

describe("worker/core/draft/genPlayers", () => {
	test("generate 70 players for the draft", async () => {
		testHelpers.resetG();
		await testHelpers.resetCache();
		idb.league = testHelpers.mockIDBLeague();
		await draft.genPlayers(g.get("season"), DEFAULT_LEVEL);
		const players = await idb.cache.players.indexGetAll(
			"playersByDraftYearRetiredYear",
			[[g.get("season")], [g.get("season"), Infinity]],
		);
		assert.strictEqual(players.length, 70); // 70 players in a draft class

		for (const p of players) {
			assert.strictEqual(p.tid, PLAYER.UNDRAFTED);
		}

		// @ts-expect-error
		idb.league = undefined;
	});
});
