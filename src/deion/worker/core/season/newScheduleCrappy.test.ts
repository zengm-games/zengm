import assert from "assert";
import testHelpers from "../../../../deion/test/helpers";
import newScheduleCrappy from "./newScheduleCrappy";
import { g } from "../../../../deion/worker/util";
import range from "lodash/range";

const makeTeams = (numTeams: number) => {
	return range(numTeams).map(tid => ({
		tid,
	}));
};

describe("deion/worker/core/season/newScheduleCrappy", () => {
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
				const matchups = newScheduleCrappy(makeTeams(numTeams));

				// Total number of games
				assert.equal(
					matchups.length * 2,
					numGames * numTeams,
					"Total number of games is wrong",
				);

				// Number of games for each teams
				const tids = matchups.flat();

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
				const matchups = newScheduleCrappy(makeTeams(numTeams)); // Total number of games

				assert.equal(
					matchups.length * 2 + 1,
					numGames * numTeams,
					"Total number of games is wrong",
				);

				// Number of games for each teams
				const tids = matchups.flat();
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

	test("when numGames is even and there are enough games, everyone gets even home and away games", () => {
		for (let numGames = 20; numGames < 50; numGames += 1) {
			if (numGames % 2 === 1) {
				continue;
			}
			for (let numTeams = 2; numTeams < 25; numTeams += 1) {
				g.setWithoutSavingToDB("numGames", numGames);
				const matchups = newScheduleCrappy(makeTeams(numTeams)); // Total number of games

				assert.equal(
					matchups.length * 2,
					numGames * numTeams,
					"Total number of games is wrong",
				);

				const home = Array(numTeams).fill(0); // Number of home games for each team
				const away = Array(numTeams).fill(0); // Number of away games for each team
				for (let i = 0; i < matchups.length; i++) {
					home[matchups[i][0]] += 1;
					away[matchups[i][1]] += 1;
				}

				for (let i = 0; i < numTeams; i++) {
					assert.equal(home[i], numGames / 2);
					assert.equal(away[i], numGames / 2);
				}
			}
		}
	});
});
