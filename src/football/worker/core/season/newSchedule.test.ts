import assert from "assert";
import flatten from "lodash/flatten";
import testHelpers from "../../../../deion/test/helpers";
import newSchedule, { newScheduleCrappy } from "./newSchedule";
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
	describe("newScheduleCrappy", () => {
		beforeEach(() => {
			testHelpers.resetG();
			g.setWithoutSavingToDB("allStarGame", false);
		});

		test("when numTeams*numGames is even, everyone gets a full schedule", () => {
			for (let numGames = 2; numGames < 50; numGames += 1) {
				for (let numTeams = 2; numTeams < 25; numTeams += 1) {
					if ((numTeams * numGames) % 2 === 1) {
						continue;
					}

					g.setWithoutSavingToDB("numGames", numGames);
					g.setWithoutSavingToDB("numTeams", numTeams);
					const matchups = newScheduleCrappy(); // Total number of games

					assert.equal(
						matchups.length * 2,
						numGames * numTeams,
						"Total number of games is wrong",
					);

					// Number of games for each teams
					const tids = flatten(matchups);

					for (let tid = 0; tid < numTeams; tid++) {
						const count = tids.filter(tid2 => tid === tid2).length;
						assert.equal(count, numGames);
					}
				}
			}
		});

		test("when numTeams*numGames is odd, one team is a game short", () => {
			for (let numGames = 2; numGames < 50; numGames += 1) {
				for (let numTeams = 2; numTeams < 25; numTeams += 1) {
					if ((numTeams * numGames) % 2 === 0) {
						continue;
					}

					g.setWithoutSavingToDB("numGames", numGames);
					g.setWithoutSavingToDB("numTeams", numTeams);
					const matchups = newScheduleCrappy(); // Total number of games

					assert.equal(
						matchups.length * 2 + 1,
						numGames * numTeams,
						"Total number of games is wrong",
					);

					// Number of games for each teams
					const tids = flatten(matchups);
					let oneShort = false;

					for (let tid = 0; tid < numTeams; tid++) {
						const count = tids.filter(tid2 => tid === tid2).length;

						if (count + 1 === numGames) {
							if (oneShort) {
								throw new Error("Two teams are one game short");
							}

							oneShort = true;
						} else {
							assert.equal(count, numGames);
						}
					}

					assert(oneShort, "Did not find team with one game short");
				}
			}
		});
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
			const home = Array(g.get("numTeams")).fill(0); // Number of home games for each team

			const away = Array(g.get("numTeams")).fill(0); // Number of away games for each team

			for (let i = 0; i < tids.length; i++) {
				home[tids[i][0]] += 1;
				away[tids[i][1]] += 1;
			}

			for (let i = 0; i < g.get("numTeams"); i++) {
				assert.equal(home[i], 8);
				assert.equal(away[i], 8);
			}
		});

		test("schedule each team one home game against every team in the same division", () => {
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
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 0), 29);
				assert.equal(testHelpers.numInArrayEqualTo(home[i], 1), 3);
			}
		});
	});
});
