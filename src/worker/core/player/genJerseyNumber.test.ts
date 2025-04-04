import { assert, beforeAll, test } from "vitest";
import testHelpers from "../../../test/helpers";
import { player } from "..";
import genJerseyNumber from "./genJerseyNumber";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels";

beforeAll(async () => {
	testHelpers.resetG();
	await testHelpers.resetCache({
		players: [],
	});
});

test("player with no stats", async () => {
	const p = player.generate(0, 25, 2020, true, DEFAULT_LEVEL);
	const jerseyNumber = await genJerseyNumber(p);
	assert.strictEqual(typeof jerseyNumber, "string");
});

test("player with stats containing no jersey number", async () => {
	const p = player.generate(0, 25, 2020, true, DEFAULT_LEVEL);
	p.stats = [{}];
	const jerseyNumber = await genJerseyNumber(p);
	assert.strictEqual(typeof jerseyNumber, "string");
});
