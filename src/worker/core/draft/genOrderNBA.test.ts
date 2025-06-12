import { afterAll, assert, beforeAll, test } from "vitest";
import { getDraftTids, loadTeamSeasons } from "./testHelpers.ts";
import testHelpers from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";

beforeAll(async () => {
	testHelpers.resetG();
	idb.league = testHelpers.mockIDBLeague();

	await loadTeamSeasons();
});
afterAll(() => {
	// @ts-expect-error
	idb.league = undefined;
});

test("schedule 60 draft picks", async () => {
	const draftTids = await getDraftTids();
	assert.strictEqual(draftTids.length, 60);
});

test("give the 3 teams with the lowest win percentage picks not lower than 6", async () => {
	const draftTids = await getDraftTids();
	const tids = [16, 28, 21]; // teams with lowest winp

	for (const [i, tid] of tids.entries()) {
		assert(draftTids.indexOf(tid) >= 0);
		assert(draftTids.indexOf(tid) <= i + 3);
		assert.strictEqual(draftTids.lastIndexOf(tid), 30 + i);
	}
});

test("give lottery team with better record than playoff teams a pick based on actual record for round 2", async () => {
	const draftTids = await getDraftTids();
	const pofteams = [23, 10, 18, 24, 14]; // good record lottery team

	assert(draftTids.indexOf(17) >= 0);
	assert(draftTids.indexOf(17) <= 13);
	assert.strictEqual(draftTids.lastIndexOf(17), 48); // bad record playoff team

	for (const tid of pofteams) {
		assert(draftTids.indexOf(tid) > draftTids.indexOf(17));
		assert(draftTids.lastIndexOf(tid) < draftTids.lastIndexOf(17));
	}
});

test("give reverse round 2 order for teams with the same record", async () => {
	const draftTids = await getDraftTids();
	const sameRec = [
		[3, 15, 25],
		[10, 18],
		[13, 26],
	];

	// First set of tids can fail because all 3 teams are in the lottery, although with low odds
	const lotteryTids = draftTids.slice(0, 3);
	for (const tid of sameRec[0]!) {
		if (lotteryTids.includes(tid)) {
			// Skip this test, it will fail otherwise
			sameRec.shift();
			break;
		}
	}

	for (const tids of sameRec) {
		const r1picks = draftTids.filter((tid, i) => tids.includes(tid) && i < 30);
		const r2picks = draftTids.filter((tid, i) => tids.includes(tid) && i >= 30);
		assert.deepStrictEqual(r1picks, r2picks.reverse());
	}
});
