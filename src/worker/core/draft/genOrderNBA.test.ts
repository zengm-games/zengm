import assert from "assert";
import { getDraftTids, loadTeamSeasons } from "./testHelpers";
import testHelpers from "../../../test/helpers";
import { idb } from "../../db";

describe("worker/core/draft/genOrder", () => {
	beforeAll(async () => {
		testHelpers.resetG();
		idb.league = testHelpers.mockIDBLeague();

		await loadTeamSeasons();
	});
	afterAll(() => {
		// @ts-ignore
		idb.league = undefined;
	});

	test("schedule 60 draft picks", async () => {
		const draftTids = await getDraftTids();
		assert.strictEqual(draftTids.length, 60);
	});

	test("give the 3 teams with the lowest win percentage picks not lower than 6", async () => {
		const draftTids = await getDraftTids();
		const tids = [16, 28, 21]; // teams with lowest winp

		for (let i = 0; i < tids.length; i++) {
			assert(draftTids.indexOf(tids[i]) >= 0);
			assert(draftTids.indexOf(tids[i]) <= i + 3);
			assert.strictEqual(draftTids.lastIndexOf(tids[i]), 30 + i);
		}
	});

	test("give lottery team with better record than playoff teams a pick based on actual record for round 2", async () => {
		const draftTids = await getDraftTids();
		const pofteams = [23, 10, 18, 24, 14]; // good record lottery team

		assert(draftTids.indexOf(17) >= 0);
		assert(draftTids.indexOf(17) <= 13);
		assert.strictEqual(draftTids.lastIndexOf(17), 48); // bad record playoff team

		for (let i = 0; i < pofteams.length; i++) {
			assert(draftTids.indexOf(pofteams[i]) > draftTids.indexOf(17));
			assert(draftTids.lastIndexOf(pofteams[i]) < draftTids.lastIndexOf(17));
		}
	});

	test("give reverse round 2 order for teams with the same record", async () => {
		const draftTids = await getDraftTids();
		const sameRec = [
			[3, 15, 25],
			[10, 18],
			[13, 26],
		]; // First set of tids can fail because all 3 teams are in the lottery, although with low odds

		const lotteryTids = draftTids.slice(0, 3);

		for (const tid of sameRec[0]) {
			if (lotteryTids.includes(tid)) {
				// Skip this test, it will fail otherwise
				sameRec.shift();
				break;
			}
		}

		for (const tids of sameRec) {
			const r1picks = draftTids.filter(
				(tid, i) => tids.includes(tid) && i < 30,
			);
			const r2picks = draftTids.filter(
				(tid, i) => tids.includes(tid) && i >= 30,
			);
			assert.deepStrictEqual(r1picks, r2picks.reverse());
		}
	});
});
