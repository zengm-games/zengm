import assert from "assert";
import testHelpers from "../../../test/helpers";
import newSchedule from "./newSchedule.football";
import { helpers } from "../../util";

describe("worker/core/season/newSchedule.football", () => {
	let defaultTeams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[];

	beforeAll(() => {
		defaultTeams = helpers.getTeamsDefault().map(t => ({
			// Don't need tid to start at 0, could be disabled teams!
			tid: t.tid + 2,
			seasonAttrs: {
				cid: t.cid,
				did: t.did,
			},
		}));
	});

	describe("newScheduleDefault", () => {
		beforeAll(() => {
			testHelpers.resetG();
		});

		test("schedule 256 games (16 each for 32 teams)", () => {
			assert.strictEqual(newSchedule(defaultTeams).length, 256);
		});

		test("schedule 8 home games and 8 away games for each team", () => {
			const tids = newSchedule(defaultTeams);

			const home: Record<number, number> = {}; // Number of home games for each team
			const away: Record<number, number> = {}; // Number of away games for each team
			for (let i = 0; i < tids.length; i++) {
				if (home[tids[i][0]] === undefined) {
					home[tids[i][0]] = 0;
				}
				if (away[tids[i][1]] === undefined) {
					away[tids[i][1]] = 0;
				}
				home[tids[i][0]] += 1;
				away[tids[i][1]] += 1;
			}

			assert.strictEqual(Object.keys(home).length, defaultTeams.length);

			for (const numGames of [...Object.values(home), ...Object.values(away)]) {
				assert.strictEqual(numGames, 8);
			}
		});

		test("schedule each team two home games against every team in the same division", () => {
			const tids = newSchedule(defaultTeams);

			// Each element in this object is an object representing the number of home games against each other team (only the ones in the same division will be populated)
			const home: Record<number, Record<number, number>> = {};

			for (let i = 0; i < tids.length; i++) {
				const t0 = defaultTeams.find(t => t.tid === tids[i][0]);
				const t1 = defaultTeams.find(t => t.tid === tids[i][1]);
				if (!t0 || !t1) {
					console.log(tids[i]);
					throw new Error("Team not found");
				}
				if (t0.seasonAttrs.did === t1.seasonAttrs.did) {
					if (home[tids[i][1]] === undefined) {
						home[tids[i][1]] = {};
					}
					if (home[tids[i][1]][tids[i][0]] === undefined) {
						home[tids[i][1]][tids[i][0]] = 0;
					}
					home[tids[i][1]][tids[i][0]] += 1;
				}
			}

			assert.strictEqual(Object.keys(home).length, defaultTeams.length);

			for (const { tid } of defaultTeams) {
				assert.strictEqual(Object.values(home[tid]).length, 3);
				assert.strictEqual(
					testHelpers.numInArrayEqualTo(Object.values(home[tid]), 1),
					3,
				);
			}
		});
	});
});
