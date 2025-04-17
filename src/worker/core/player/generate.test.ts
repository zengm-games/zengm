import { assert, test } from "vitest";
import player from "./index.ts";
import testHelpers from "../../../test/helpers.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";

test("create player with no stats", () => {
	testHelpers.resetG();
	const p = player.generate(-2, 19, 2012, false, DEFAULT_LEVEL);
	assert.strictEqual(p.stats.length, 0);
});
