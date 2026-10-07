import { afterAll, assert, beforeAll, describe, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import { getSlotPickProbs } from "./getSlotPickProbs.ts";
import { range } from "../../../common/utils.ts";

const NUM_TEAMS = 30;

const sum = (numbers: number[]) => {
	return numbers.reduce((total, number) => total + number, 0);
};

// Each slot gets exactly one pick, and each pick goes to exactly one slot
const assertValidProbs = (probs: number[][]) => {
	assert.strictEqual(probs.length, NUM_TEAMS);
	for (const row of probs) {
		assert.strictEqual(row.length, NUM_TEAMS);
		assert.closeTo(sum(row), 1, 1e-9);
	}
	for (let pick = 0; pick < NUM_TEAMS; pick++) {
		assert.closeTo(sum(probs.map((row) => row[pick]!)), 1, 1e-9);
	}
};

// For when the order is known with certainty
const getPicks = (probs: number[][]) => {
	return probs.map((row) => row.indexOf(1));
};

beforeAll(async () => {
	resetG();
	await resetCache({});
	idb.league = mockIDBLeague();
	g.setWithoutSavingToDB("playIn", true);
});
afterAll(() => {
	resetG();
});

describe("no lottery", () => {
	for (const round of [1, 2]) {
		test(`noLottery, round ${round}`, async () => {
			const probs = await getSlotPickProbs({
				draftType: "noLottery",
				round,
				numTeams: NUM_TEAMS,
			});
			assertValidProbs(probs);
			assert.deepStrictEqual(getPicks(probs), range(NUM_TEAMS));
		});

		test(`noLotteryReverse, round ${round}`, async () => {
			const probs = await getSlotPickProbs({
				draftType: "noLotteryReverse",
				round,
				numTeams: NUM_TEAMS,
			});
			assertValidProbs(probs);
			assert.deepStrictEqual(getPicks(probs), range(NUM_TEAMS).reverse());
		});

		test(`random, round ${round}`, async () => {
			const probs = await getSlotPickProbs({
				draftType: "random",
				round,
				numTeams: NUM_TEAMS,
			});
			assertValidProbs(probs);
			for (const row of probs) {
				for (const prob of row) {
					assert.closeTo(prob, 1 / NUM_TEAMS, 1e-9);
				}
			}
		});
	}
});

describe("nba2019", () => {
	test("round 1", async () => {
		const probs = await getSlotPickProbs({
			draftType: "nba2019",
			round: 1,
			numTeams: NUM_TEAMS,
		});
		assertValidProbs(probs);

		// Worst 3 teams each have a 14% chance at the top pick, and can't fall further than 4 spots
		for (const slot of [0, 1, 2]) {
			assert.closeTo(probs[slot]![0]!, 0.14, 1e-9);
			assert.closeTo(sum(probs[slot]!.slice(slot + 5)), 0, 1e-9);
		}

		// Last lottery team has a small chance of moving up
		assert.closeTo(probs[13]![0]!, 0.005, 1e-9);

		// Playoff teams are not in the lottery
		assert.deepStrictEqual(
			getPicks(probs).slice(14),
			range(NUM_TEAMS).slice(14),
		);
	});

	test("round 2", async () => {
		const probs = await getSlotPickProbs({
			draftType: "nba2019",
			round: 2,
			numTeams: NUM_TEAMS,
		});
		assertValidProbs(probs);
		assert.deepStrictEqual(getPicks(probs), range(NUM_TEAMS));
	});
});

describe("nba2027", () => {
	test("round 1", async () => {
		const probs = await getSlotPickProbs({
			draftType: "nba2027",
			round: 1,
			numTeams: NUM_TEAMS,
		});
		assertValidProbs(probs);

		// Worst 3 teams have the same chances as each other, and worse than the teams right after them
		assert.closeTo(probs[0]![0]!, probs[2]![0]!, 1e-9);
		assert.isBelow(probs[0]![0]!, probs[3]![0]!);

		// Worst 3 teams can't fall past the 12th pick
		for (const slot of [0, 1, 2]) {
			assert.closeTo(sum(probs[slot]!.slice(12)), 0, 1e-9);
		}

		// Losers of the 7/8 play-in games are the last 2 lottery teams, with the worst chances
		assert.isAbove(probs[15]![0]!, 0);
		assert.isBelow(probs[15]![0]!, probs[13]![0]!);

		// Playoff teams are not in the lottery
		assert.deepStrictEqual(
			getPicks(probs).slice(16),
			range(NUM_TEAMS).slice(16),
		);
	});

	test("round 2", async () => {
		const probs = await getSlotPickProbs({
			draftType: "nba2027",
			round: 2,
			numTeams: NUM_TEAMS,
		});
		assertValidProbs(probs);

		// Lottery teams are in reverse order
		assert.deepStrictEqual(getPicks(probs), [
			...range(16).reverse(),
			...range(NUM_TEAMS).slice(16),
		]);
	});
});
