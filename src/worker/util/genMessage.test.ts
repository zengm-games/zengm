import { assert, beforeEach, test } from "vitest";
import testHelpers from "../../test/helpers.ts";
import { team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import g from "./g.ts";
import genMessage from "./genMessage.ts";
import { helpers } from "../../common/index.ts";

beforeEach(async () => {
	testHelpers.resetG();
	g.setWithoutSavingToDB("gracePeriodEnd", g.get("season"));

	const teamsDefault = helpers.getTeamsDefault();
	await testHelpers.resetCache({
		teamSeasons: [team.genSeasonRow(teamsDefault[g.get("userTid")]!)],
	});

	idb.league = testHelpers.mockIDBLeague();
});

test("even when already at the max, recognizes excellent performance", async () => {
	const teamSeasons = await idb.cache.teamSeasons.getAll();
	assert.strictEqual(teamSeasons.length, 1);
	teamSeasons[0]!.ownerMood = {
		money: 1,
		playoffs: 1,
		wins: 1,
	};

	await genMessage(
		{
			money: 1,
			playoffs: 1,
			wins: 1,
		},
		{
			money: 0,
			playoffs: 0,
			wins: 0,
		},
	);

	const messages = await idb.cache.messages.getAll();
	assert.strictEqual(messages.length, 1);
	const message = messages[0]!;

	assert(message.text.includes("This year: Excellent!"));
	assert(message.text.includes("Overall: Excellent!"));
});

test("when at max for one component, message falls in between what you'd expect when using the uncapped or capped deltas alone", async () => {
	const teamSeasons = await idb.cache.teamSeasons.getAll();
	assert.strictEqual(teamSeasons.length, 1);
	teamSeasons[0]!.ownerMood = {
		money: 1,
		playoffs: -0.6,
		wins: -0.6,
	};

	await genMessage(
		{
			money: 1,
			playoffs: -0.1,
			wins: -0.1,
		},
		{
			money: 0,
			playoffs: -0.1,
			wins: -0.1,
		},
	);

	const messages = await idb.cache.messages.getAll();
	assert.strictEqual(messages.length, 1);
	const message = messages[0]!;

	assert(message.text.includes("This year: Good."));
	assert(message.text.includes("Overall: Bad."));
});
