/**
 * This is not actually a test, it's a script to see what the quartiles of ovr ratings look like for different draftAge settings, for use when parametrizing the age adjustment in genRatings.
 *
 * Run this like:
 *
 * $ SPORT=basketball yarn jest src/worker/core/player/genRatings.test.ts | grep QUARTILES
 *
 * It's in jest rather than node.js because jest has all the imports and crap set up.
 */

import range from "lodash/range";
import { PLAYER } from "../../../common";
import { createWithoutSaving } from "../league/create";

const printQuartiles = async (age?: number) => {
	const gameAttributes =
		age !== undefined
			? {
					draftAges: [age, age],
			  }
			: undefined;
	const leagueData = await createWithoutSaving(
		0,
		{
			startingSeason: 2021,
			gameAttributes,
		},
		false,
		0,
	);
	const ovrs = (leagueData.players as any[])
		.filter(p => p.tid >= PLAYER.FREE_AGENT)
		.map(p => p.ratings[p.ratings.length - 1].ovr)
		.sort((a, b) => a - b) as number[];
	const quartiles = [0.25, 0.5, 0.75].map(
		fraction => ovrs[Math.round(fraction * ovrs.length)],
	);
	console.log(
		"QUARTILES at",
		age !== undefined ? `age ${String(age).padStart(2)} ` : "default",
		quartiles,
	);
};

describe("worker/core/player/genRatings", () => {
	test("no error with restricted draftAges and forceRetireAge settings", async () => {
		await printQuartiles();

		for (const age of range(0, 50, 5)) {
			await printQuartiles(age);
		}
	});
});
