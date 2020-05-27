import assert from "assert";
import testHelpers from "../../../../deion/test/helpers";
import newSchedule from "./newSchedule";
import { g, helpers } from "../../../../deion/worker/util";

describe("football/worker/core/season/newSchedule", () => {
	let defaultTeams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[];

	beforeAll(() => {
		process.env.SPORT = "football";
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
		});

		test("schedule 256 games (16 each for 32 teams)", () => {
			assert.equal(newSchedule(defaultTeams).length, 256);
		});

		test("schedule 8 home games and 8 away games for each team", () => {
			const tids = newSchedule(defaultTeams);
			const home = Array(defaultTeams.length).fill(0); // Number of home games for each team

			const away = Array(defaultTeams.length).fill(0); // Number of away games for each team

			for (let i = 0; i < tids.length; i++) {
				home[tids[i][0]] += 1;
				away[tids[i][1]] += 1;
			}

			for (let i = 0; i < defaultTeams.length; i++) {
				assert.equal(home[i], 8);
				assert.equal(away[i], 8);
			}
		});

		test("schedule each team one home game against every team in the same division", () => {
			const tids = newSchedule(defaultTeams);
			const home: number[][] = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)

			for (let i = 0; i < defaultTeams.length; i++) {
				home.push(Array(defaultTeams.length).fill(0));
			}

			const teams = helpers.getTeamsDefault();

			for (let i = 0; i < tids.length; i++) {
				if (teams[tids[i][0]].did === teams[tids[i][1]].did) {
					home[tids[i][1]][tids[i][0]] += 1;
				}
			}

			for (let i = 0; i < defaultTeams.length; i++) {
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 0), 29);
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 1), 3);
			}
		});
	});
});
