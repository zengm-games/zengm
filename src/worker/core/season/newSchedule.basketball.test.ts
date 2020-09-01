import assert from "assert";
import testHelpers from "../../../test/helpers";
import newSchedule from "./newSchedule.basketball";
import { g, helpers } from "../../util";

describe("worker/core/season/newSchedule.basketball", () => {
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
			g.setWithoutSavingToDB("allStarGame", false);
		});

		test("schedule 1230 games (82 each for 30 teams)", () => {
			assert.strictEqual(newSchedule(defaultTeams).length, 1230);
		});

		test("schedule 41 home games and 41 away games for each team", () => {
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
				assert.strictEqual(numGames, 41);
			}
		});

		test("schedule each team one home game against every team in the other conference", () => {
			const tids = newSchedule(defaultTeams);

			// Each element in this object is an object representing the number of home games against each other team (only the ones in the other conference will be populated)
			const home: Record<number, Record<number, number>> = {};

			for (let i = 0; i < tids.length; i++) {
				const t0 = defaultTeams.find(t => t.tid === tids[i][0]);
				const t1 = defaultTeams.find(t => t.tid === tids[i][1]);
				if (!t0 || !t1) {
					console.log(tids[i]);
					throw new Error("Team not found");
				}
				if (t0.seasonAttrs.cid !== t1.seasonAttrs.cid) {
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
				assert.strictEqual(Object.values(home[tid]).length, 15);
				assert.strictEqual(
					testHelpers.numInArrayEqualTo(Object.values(home[tid]), 1),
					15,
				);
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
				assert.strictEqual(Object.values(home[tid]).length, 4);
				assert.strictEqual(
					testHelpers.numInArrayEqualTo(Object.values(home[tid]), 2),
					4,
				);
			}
		});

		test("schedule each team one or two home games against every team in the same conference but not in the same division (one game: 2/10 teams; two games: 8/10 teams)", () => {
			const tids = newSchedule(defaultTeams);

			// Each element in this object is an object representing the number of home games against each other team (only the ones in the same conference but different division will be populated)
			const home: Record<number, Record<number, number>> = {};

			for (let i = 0; i < tids.length; i++) {
				const t0 = defaultTeams.find(t => t.tid === tids[i][0]);
				const t1 = defaultTeams.find(t => t.tid === tids[i][1]);
				if (!t0 || !t1) {
					console.log(tids[i]);
					throw new Error("Team not found");
				}
				if (
					t0.seasonAttrs.cid === t1.seasonAttrs.cid &&
					t0.seasonAttrs.did !== t1.seasonAttrs.did
				) {
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
				assert.strictEqual(Object.values(home[tid]).length, 10);
				assert.strictEqual(
					testHelpers.numInArrayEqualTo(Object.values(home[tid]), 1),
					2,
				);
				assert.strictEqual(
					testHelpers.numInArrayEqualTo(Object.values(home[tid]), 2),
					8,
				);
			}
		});
	});
});
