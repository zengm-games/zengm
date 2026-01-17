import { assert, beforeAll, test } from "vitest";
import testHelpers from "../../../test/helpers.ts";
import newScheduleGood from "./newScheduleGood.ts";
import { helpers } from "../../util/index.ts";

let defaultTeams: {
	seasonAttrs: {
		cid: number;
		did: number;
	};
	tid: number;
}[];

beforeAll(() => {
	defaultTeams = helpers.getTeamsDefault().map((t) => ({
		// Don't need tid to start at 0, could be disabled teams!
		tid: t.tid + 2,
		seasonAttrs: {
			cid: t.cid,
			did: t.did,
		},
	}));

	testHelpers.resetG();
});

test("schedule 272 games (17 each for 32 teams)", () => {
	const { tids, warning } = newScheduleGood(defaultTeams);
	assert.strictEqual(warning, undefined);
	assert.strictEqual(tids.length, 272);
});

test("schedule 8 home games and 8 away games for each team", () => {
	const { tids, warning } = newScheduleGood(defaultTeams);
	assert.strictEqual(warning, undefined);

	const home: Record<number, number> = {}; // Number of home games for each team
	const away: Record<number, number> = {}; // Number of away games for each team
	for (const matchup of tids) {
		if (home[matchup[0]] === undefined) {
			home[matchup[0]] = 0;
		}
		if (away[matchup[1]] === undefined) {
			away[matchup[1]] = 0;
		}
		home[matchup[0]]! += 1;
		away[matchup[1]]! += 1;
	}

	assert.strictEqual(Object.keys(home).length, defaultTeams.length);

	for (const numGames of [...Object.values(home), ...Object.values(away)]) {
		if (numGames !== 8 && numGames !== 9) {
			throw new Error(`Got ${numGames} home/away games`);
		}
	}
});

test("schedule each team two home games against every team in the same division", () => {
	const { tids, warning } = newScheduleGood(defaultTeams);
	assert.strictEqual(warning, undefined);

	// Each element in this object is an object representing the number of home games against each other team (only the ones in the same division will be populated)
	const home: Record<number, Record<number, number>> = {};

	for (const matchup of tids) {
		const t0 = defaultTeams.find((t) => t.tid === matchup[0]);
		const t1 = defaultTeams.find((t) => t.tid === matchup[1]);
		if (!t0 || !t1) {
			console.log(matchup);
			throw new Error("Team not found");
		}
		if (t0.seasonAttrs.did === t1.seasonAttrs.did) {
			if (home[matchup[1]] === undefined) {
				home[matchup[1]] = {};
			}
			if (home[matchup[1]]![matchup[0]] === undefined) {
				home[matchup[1]]![matchup[0]] = 0;
			}
			home[matchup[1]]![matchup[0]]! += 1;
		}
	}

	assert.strictEqual(Object.keys(home).length, defaultTeams.length);

	for (const { tid } of defaultTeams) {
		assert.strictEqual(Object.values(home[tid]!).length, 3);
		assert.strictEqual(
			testHelpers.numInArrayEqualTo(Object.values(home[tid]!), 1),
			3,
		);
	}
});
