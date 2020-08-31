import assert from "assert";
import testHelpers from "../../../test/helpers";
import { player } from "..";
import genJerseyNumber from "./genJerseyNumber";

describe("worker/core/player/genJerseyNumber", () => {
	beforeAll(async () => {
		testHelpers.resetG();
		await testHelpers.resetCache({
			players: [],
		});
	});

	test("player with no stats", async () => {
		const p = player.generate(0, 25, 2020, true, 15.5);
		const jerseyNumber = await genJerseyNumber(p);
		assert.strictEqual(typeof jerseyNumber, "string");
	});

	test("player with stats containing no jersey number", async () => {
		const p = player.generate(0, 25, 2020, true, 15.5);
		p.stats = [{}];
		const jerseyNumber = await genJerseyNumber(p);
		assert.strictEqual(typeof jerseyNumber, "string");
	});
});
