import { afterEach, assert, test } from "vitest";
import { PHASE } from "../../../common/constants.ts";
import type { DraftLotteryResult, Phase } from "../../../common/types.ts";
import { mockIDBLeague } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import setGameAttributes from "../league/setGameAttributes.ts";
import { draft } from "../index.ts";
import { loadTeamSeasons } from "./testHelpers.ts";

const addStaleDraftLotteryResult = async () => {
	const draftLotteryResult: DraftLotteryResult = {
		season: g.get("season"),
		draftType: "nba1994",
		result: [
			{
				tid: 0,
				originalTid: 0,
				chances: 140,
				pick: 1,
				dpid: 0,
			},
		],
	};

	await idb.cache.draftLotteryResults.put(draftLotteryResult);
};

const setup = async (phase: Phase) => {
	idb.league = mockIDBLeague();
	await loadTeamSeasons();
	g.setWithoutSavingToDB("phase", phase);
	g.setWithoutSavingToDB("draftType", "nba1994");
	await addStaleDraftLotteryResult();
};

afterEach(() => {
	// @ts-expect-error
	idb.league = undefined;
});

test("changing draft type during draft lottery deletes stale lottery result and generates order", async () => {
	await setup(PHASE.DRAFT_LOTTERY);

	const draftPicksBefore = await draft.getOrder();
	assert.strictEqual(draftPicksBefore.length, 60);
	assert(draftPicksBefore.every((dp) => dp.pick === 0));

	await setGameAttributes({
		draftType: "random",
	});

	const draftLotteryResult = await idb.getCopy.draftLotteryResults(
		{
			season: g.get("season"),
		},
		"noCopyCache",
	);
	assert.strictEqual(draftLotteryResult, undefined);

	const draftPicksAfter = await draft.getOrder();
	assert.strictEqual(draftPicksAfter.length, 60);
	assert(draftPicksAfter.every((dp) => dp.pick > 0));
	assert.strictEqual(g.get("numDraftPicksCurrent"), 60);
});

test("changing draft type before draft lottery does not delete lottery result or generate order", async () => {
	await setup(PHASE.PLAYOFFS);

	await setGameAttributes({
		draftType: "random",
	});

	const draftLotteryResult = await idb.getCopy.draftLotteryResults(
		{
			season: g.get("season"),
		},
		"noCopyCache",
	);
	assert(draftLotteryResult);
	assert.strictEqual(draftLotteryResult.draftType, "nba1994");

	const draftPicks = await draft.getOrder();
	assert.strictEqual(draftPicks.length, 60);
	assert(draftPicks.every((dp) => dp.pick === 0));
});
