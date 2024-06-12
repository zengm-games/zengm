import assert from "assert";
import testHelpers from "../../../test/helpers";
import generateMatches from "./newScheduleSpeculative.Football";
import { random } from "lodash-es";
import scheduleSort from "./scheduleSortSpeculative";

describe("worker/core/season/scheduleSortSpeculative", () => {
	let matches: number[][];
	let year: number;
	let newDefaultTeams: number[];

	beforeAll(() => {});
	beforeEach(async () => {
		year = random(2500);
		newDefaultTeams = Array.from(Array(32).keys());
		matches = await generateMatches(newDefaultTeams, year);
	});

	describe("football", () => {
		beforeAll(() => {
			testHelpers.resetG();
		});

		test("18 week schedule", () => {
			const schedule = scheduleSort(matches);
			assert.strictEqual(schedule.length, 18);
		});

		// fix it
		// test("At least 10 games a week", () => {
		// 	const schedule = scheduleSort(matches);
		// 	schedule.forEach(w => {
		// 		assert(w.length >= 10);
		// 	});
		// });

		test("Every team plays 17 games", () => {
			const schedule = scheduleSort(matches);
			const games: Record<number, number> = {}; // Number of home games for each team
			schedule.forEach(m => {
				if (games[m.homeTid] === undefined) {
					games[m.homeTid] = 0;
				}
				if (games[m.awayTid] === undefined) {
					games[m.awayTid] = 0;
				}
				games[m.homeTid] += 1;
				games[m.awayTid] += 1;
			});
			assert.strictEqual(Object.keys(games).length, newDefaultTeams.length);

			newDefaultTeams.forEach(t => {
				assert.strictEqual(games[t], 17);
			});
		});
	});
});
