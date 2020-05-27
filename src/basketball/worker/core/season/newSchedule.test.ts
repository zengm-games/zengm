import assert from "assert";
import testHelpers from "../../../../deion/test/helpers";
import newSchedule from "./newSchedule";
import { g, helpers } from "../../../../deion/worker/util";

describe("basketball/worker/core/season/newSchedule", () => {
	let defaultTeams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[];

	beforeAll(() => {
		defaultTeams = helpers.getTeamsDefault().map(t => ({
			tid: t.tid,
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
			assert.equal(newSchedule(defaultTeams).length, 1230);
		});

		test("schedule 41 home games and 41 away games for each team", () => {
			const tids = newSchedule(defaultTeams);

			const home = Array(g.get("numTeams")).fill(0); // Number of home games for each team
			const away = Array(g.get("numTeams")).fill(0); // Number of away games for each team
			for (let i = 0; i < tids.length; i++) {
				home[tids[i][0]] += 1;
				away[tids[i][1]] += 1;
			}

			for (let i = 0; i < g.get("numTeams"); i++) {
				assert.equal(home[i], 41);
				assert.equal(away[i], 41);
			}
		});

		test("schedule each team one home game against every team in the other conference", () => {
			const tids = newSchedule(defaultTeams);
			const home: number[][] = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)

			for (let i = 0; i < g.get("numTeams"); i++) {
				home.push(Array(g.get("numTeams")).fill(0));
			}

			const teams = helpers.getTeamsDefault();

			for (let i = 0; i < tids.length; i++) {
				if (teams[tids[i][0]].cid !== teams[tids[i][1]].cid) {
					home[tids[i][1]][tids[i][0]] += 1;
				}
			}

			for (let i = 0; i < g.get("numTeams"); i++) {
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 0), 15);
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 1), 15);
			}
		});

		test("schedule each team two home games against every team in the same division", () => {
			const tids = newSchedule(defaultTeams);
			const home: number[][] = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)

			for (let i = 0; i < g.get("numTeams"); i++) {
				home.push(Array(g.get("numTeams")).fill(0));
			}

			const teams = helpers.getTeamsDefault();

			for (let i = 0; i < tids.length; i++) {
				if (teams[tids[i][0]].did === teams[tids[i][1]].did) {
					home[tids[i][1]][tids[i][0]] += 1;
				}
			}

			for (let i = 0; i < g.get("numTeams"); i++) {
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 0), 26);
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 2), 4);
			}
		});

		test("schedule each team one or two home games against every team in the same conference but not in the same division (one game: 2/10 teams; two games: 8/10 teams)", () => {
			const tids = newSchedule(defaultTeams);
			const home: number[][] = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)

			for (let i = 0; i < g.get("numTeams"); i++) {
				home.push(Array(g.get("numTeams")).fill(0));
			}

			const teams = helpers.getTeamsDefault();

			for (let i = 0; i < tids.length; i++) {
				if (
					teams[tids[i][0]].cid === teams[tids[i][1]].cid &&
					teams[tids[i][0]].did !== teams[tids[i][1]].did
				) {
					home[tids[i][1]][tids[i][0]] += 1;
				}
			}

			for (let i = 0; i < g.get("numTeams"); i++) {
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 0), 20);
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 1), 2);
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 2), 8);
			}
		});
	});
});
