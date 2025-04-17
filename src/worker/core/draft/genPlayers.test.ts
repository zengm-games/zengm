import { assert, test } from "vitest";
import { PLAYER } from "../../../common/index.ts";
import testHelpers from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import { draft } from "../index.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";

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
