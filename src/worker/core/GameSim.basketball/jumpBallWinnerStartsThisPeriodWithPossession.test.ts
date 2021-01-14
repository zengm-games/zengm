import assert from "assert";
import jumpBallWinnerStartsThisPeriodWithPossession from "./jumpBallWinnerStartsThisPeriodWithPossession";

const short = jumpBallWinnerStartsThisPeriodWithPossession;

describe("worker/core/GameSim.basketball", () => {
	describe("jumpBallWinnerStartsThisPeriodWithPossession", () => {
		test("numPeriods is odd", () => {
			assert.strictEqual(short(1, 5), true);
			assert.strictEqual(short(2, 5), false);
			assert.strictEqual(short(3, 5), true);
			assert.strictEqual(short(4, 5), false);
			assert.strictEqual(short(5, 5), true);

			// Overtime doesn't matter
			assert.strictEqual(short(6, 5), true);
		});

		test("numPeriods is even", () => {
			assert.strictEqual(short(1, 2), true);
			assert.strictEqual(short(2, 2), false);

			assert.strictEqual(short(1, 4), true);
			assert.strictEqual(short(2, 4), false);
			assert.strictEqual(short(3, 4), false);
			assert.strictEqual(short(4, 4), true);

			assert.strictEqual(short(1, 6), true);
			assert.strictEqual(short(2, 6), false);
			assert.strictEqual(short(3, 6), true);
			assert.strictEqual(short(4, 6), true);
			assert.strictEqual(short(5, 6), false);
			assert.strictEqual(short(6, 6), true);

			assert.strictEqual(short(1, 8), true);
			assert.strictEqual(short(2, 8), false);
			assert.strictEqual(short(3, 8), true);
			assert.strictEqual(short(4, 8), false);
			assert.strictEqual(short(5, 8), false);
			assert.strictEqual(short(6, 8), true);
			assert.strictEqual(short(7, 8), false);
			assert.strictEqual(short(8, 8), true);

			// Overtime doesn't matter
			assert.strictEqual(short(9, 8), true);
		});
	});
});
