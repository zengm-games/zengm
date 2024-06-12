import assert from "assert";
import testHelpers from "../../../test/helpers";
import generateMatches from "./newScheduleSpeculative.Football";
import { random } from "lodash-es";

describe("worker/core/season/newScheduleSpeculative", () => {
	let year: number;
	let newDefaultTeams: number[];

	beforeAll(() => {
		year = random(2500);
		newDefaultTeams = Array.from(Array(32).keys());
	});

	describe("football", () => {
		beforeAll(() => {
			testHelpers.resetG();
		});

		test("schedule 272 games (17 each for 32 teams)", async () => {
			const matches = await generateMatches(newDefaultTeams, year);
			assert.strictEqual(matches.length, 272);
		});

		test("schedule 8 home games and 8 away games for each team", async () => {
			const matches = await generateMatches(newDefaultTeams, year);
			assert.strictEqual(matches.length, 272);

			const home: Record<number, number> = {}; // Number of home games for each team
			const away: Record<number, number> = {}; // Number of away games for each team
			for (let i = 0; i < matches.length; i++) {
				if (home[matches[i][0]] === undefined) {
					home[matches[i][0]] = 0;
				}
				if (away[matches[i][1]] === undefined) {
					away[matches[i][1]] = 0;
				}
				home[matches[i][0]] += 1;
				away[matches[i][1]] += 1;
			}

			assert.strictEqual(Object.keys(home).length, newDefaultTeams.length);

			for (const numGames of [...Object.values(home), ...Object.values(away)]) {
				if (numGames !== 8 && numGames !== 9) {
					throw new Error(`Got ${numGames} home/away games`);
				}
			}
		});

		// test("schedule each team two home games against every team in the same division", () => {
		//     const matches = generateMatches(newDefaultTeams, year);
		// 	assert.strictEqual(matches.length, 272);

		// 	// Each element in this object is an object representing the number of home games against each other team (only the ones in the same division will be populated)
		// 	const home: Record<number, Record<number, number>> = {};

		// 	for (let i = 0; i < matches.length; i++) {
		// 		const t0 = defaultTeams.find(t => t.tid === tids[i][0]);
		// 		const t1 = defaultTeams.find(t => t.tid === tids[i][1]);
		// 		if (!t0 || !t1) {
		// 			console.log(tids[i]);
		// 			throw new Error("Team not found");
		// 		}
		// 		if (t0.seasonAttrs.did === t1.seasonAttrs.did) {
		// 			if (home[tids[i][1]] === undefined) {
		// 				home[tids[i][1]] = {};
		// 			}
		// 			if (home[tids[i][1]][tids[i][0]] === undefined) {
		// 				home[tids[i][1]][tids[i][0]] = 0;
		// 			}
		// 			home[tids[i][1]][tids[i][0]] += 1;
		// 		}
		// 	}

		// 	assert.strictEqual(Object.keys(home).length, defaultTeams.length);

		// 	for (const { tid } of defaultTeams) {
		// 		assert.strictEqual(Object.values(home[tid]).length, 3);
		// 		assert.strictEqual(
		// 			testHelpers.numInArrayEqualTo(Object.values(home[tid]), 1),
		// 			3,
		// 		);
		// 	}
		// });
	});
});
