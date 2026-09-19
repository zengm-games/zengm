import { expect, test } from "vitest";
import { getCumulativeWeights } from "./getCumulativeWeights.ts";

test("reuses scratch weights without retaining players removed between bids", () => {
	const scratch = [999, 999, 999, 999];
	const players = [7, 3, 10].map((softmaxValue) => ({ softmaxValue }));
	for (let length = players.length; length >= 0; length--) {
		players.length = length;
		expect(getCumulativeWeights(players, 2.5, scratch)).toBe(scratch);
	}
});
