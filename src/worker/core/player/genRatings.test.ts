/**
 * This is not actually a test, it's a script to see what the quartiles of ovr ratings look like for different draftAge settings, for use when parametrizing the age adjustment in genRatings.
 *
 * Run this like (after unskipping the test):
 *
 * $ SPORT=basketball yarn jest src/worker/core/player/genRatings.test.ts | grep QUARTILES
 *
 * It's in jest rather than node.js because jest has all the imports and crap set up.
 */

import range from "lodash-es/range";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { g } from "../../util";
import createRandomPlayers from "../league/create/createRandomPlayers";

const printQuartiles = async (age?: number) => {
	if (age !== undefined) {
		testHelpers.resetG();
		g.setWithoutSavingToDB("draftAges", [age, age]);
	}

	const players = await createRandomPlayers({
		activeTids: range(30),
		scoutingRank: 15.5,
		teams: range(30).map(tid => ({ tid })),
	});

	const ovrs = (players as any[])
		.filter(p => p.tid >= PLAYER.FREE_AGENT)
		.map(p => p.ratings.at(-1).ovr)
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

describe.skip("worker/core/player/genRatings", () => {
	test("this is not actually a test, see comment at the top of the file", async () => {
		await printQuartiles();

		for (const age of range(0, 50, 5)) {
			await printQuartiles(age);
		}
	});
});
