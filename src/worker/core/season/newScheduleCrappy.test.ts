import assert from "assert";
import testHelpers from "../../../test/helpers";
import newScheduleCrappy from "./newScheduleCrappy";
import { g } from "../../../worker/util";
import range from "lodash/range";

const makeTeams = (numTeams: number) => {
	return range(numTeams).map(tid => ({
		// Don't need tid to start at 0, could be disabled teams!
		tid: 5 + tid,
	}));
};

describe("worker/core/season/newScheduleCrappy", () => {
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
				const teams = makeTeams(numTeams);
				const matchups = newScheduleCrappy(teams);

				// Total number of games
				assert.strictEqual(
					matchups.length * 2,
					numGames * numTeams,
					"Total number of games is wrong",
				);

				// Number of games for each teams
				const tids = matchups.flat();

				for (const t of teams) {
					const count = tids.filter(tid => t.tid === tid).length;
					assert.strictEqual(count, numGames);
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
				const teams = makeTeams(numTeams);
				const matchups = newScheduleCrappy(teams); // Total number of games

				assert.strictEqual(
					matchups.length * 2 + 1,
					numGames * numTeams,
					"Total number of games is wrong",
				);

				// Number of games for each teams
				const tids = matchups.flat();
				let oneShort = false;

				for (const t of teams) {
					const count = tids.filter(tid => t.tid === tid).length;

					if (count + 1 === numGames) {
						if (oneShort) {
							throw new Error("Two teams are one game short");
						}

						oneShort = true;
					} else {
						assert.strictEqual(count, numGames);
					}
				}

				assert(oneShort, "Did not find team with one game short");
			}
		}
	});

	test("when numGames is even and there are enough games, everyone gets even home and away games", () => {
		for (let numGames = 20; numGames < 50; numGames += 1) {
			if (numGames % 2 === 1) {
				continue;
			}
			for (let numTeams = 2; numTeams < 25; numTeams += 1) {
				g.setWithoutSavingToDB("numGames", numGames);
				const teams = makeTeams(numTeams);
				const matchups = newScheduleCrappy(teams); // Total number of games

				assert.strictEqual(
					matchups.length * 2,
					numGames * numTeams,
					"Total number of games is wrong",
				);

				const home: Record<number, number> = {}; // Number of home games for each team
				const away: Record<number, number> = {}; // Number of away games for each team
				for (let i = 0; i < matchups.length; i++) {
					if (home[matchups[i][0]] === undefined) {
						home[matchups[i][0]] = 0;
					}
					if (away[matchups[i][1]] === undefined) {
						away[matchups[i][1]] = 0;
					}

					home[matchups[i][0]] += 1;
					away[matchups[i][1]] += 1;
				}

				for (const t of teams) {
					assert.strictEqual(home[t.tid], numGames / 2);
					assert.strictEqual(away[t.tid], numGames / 2);
				}
			}
		}
	});
});
