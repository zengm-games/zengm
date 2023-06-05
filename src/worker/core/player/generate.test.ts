import assert from "node:assert/strict";
import player from "./index";
import testHelpers from "../../../test/helpers";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels";

describe("worker/core/player/generate", () => {
	test("create player with no stats", () => {
		testHelpers.resetG();
		const p = player.generate(-2, 19, 2012, false, DEFAULT_LEVEL);
		assert.strictEqual(p.stats.length, 0);
	});
});
