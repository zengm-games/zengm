import { assert, test } from "vitest";
import { RATINGS, PLAYER } from "../../../common/constants.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import { resetG } from "../../../test/helpers.ts";
import { g } from "../../util/index.ts";
import { last } from "../../../common/utils.ts";
import player from "./index.ts";
import {
	finalizeProgBreakdown,
	getBaseChange,
	getRatingChangeBreakdown,
} from "./developmentBreakdown.ts";

test("rating development breakdown components sum to the applied rating change", () => {
	const baseChange = getBaseChange(2, -0.75, 80);
	const { newRating, progBreakdown } = getRatingChangeBreakdown({
		ageModifier: 1.5,
		baseChange,
		changeLimits: [-12, 12],
		factor: 0.9,
		oldRating: 50,
	});

	assert.closeTo(
		progBreakdown[0] + progBreakdown[1] + progBreakdown[2],
		newRating - 50,
		1e-12,
	);
});

test("finalized development breakdown components sum to the average rating change", () => {
	assert.deepStrictEqual(
		finalizeProgBreakdown([3, 1, 100], 6, 2),
		[1.5, 0.5, 1],
	);
});

test("annual development stores a rounded breakdown on the new ratings row", async () => {
	resetG();
	const p = player.generate(
		PLAYER.FREE_AGENT,
		19,
		g.get("season"),
		false,
		DEFAULT_LEVEL,
	);

	g.setWithoutSavingToDB("season", g.get("season") + 1);
	player.addRatingsRow(p);

	const ratings = last(p.ratings);
	const ratingsTotalBefore = getRatingsTotal(ratings);
	await player.develop(p, 1, false, DEFAULT_LEVEL, true);
	const ratingsTotalAfter = getRatingsTotal(ratings);
	const progBreakdown = ratings.progBreakdown;

	assert(progBreakdown);
	assert.strictEqual(progBreakdown.length, 3);
	assert.closeTo(
		progBreakdown[0] + progBreakdown[1] + progBreakdown[2],
		(ratingsTotalAfter - ratingsTotalBefore) / RATINGS.length,
		0.151,
	);
});

const getRatingsTotal = (ratings: any) => {
	let total = 0;

	for (const key of RATINGS) {
		total += ratings[key];
	}

	return total;
};
