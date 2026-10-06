import { afterAll, assert, beforeAll, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { getFirstRoundSlotProbs } from "./getFirstRoundSlotProbs.ts";

const NUM_SIMS = 500;

// Projected winp evenly spaced from 25% to 75%, with teams from both conferences mixed throughout
const getTeams = () => {
	return helpers.getTeamsDefault().map((t, i, teams) => {
		return {
			tid: t.tid,
			cid: t.cid,
			did: t.did,
			winp: 0.25 + (0.5 * ((i * 7) % teams.length)) / (teams.length - 1),
			winpStd: 0.08,
		};
	});
};

const sum = (numbers: number[]) => {
	return numbers.reduce((total, number) => total + number, 0);
};

beforeAll(async () => {
	resetG();
	await resetCache({});
	idb.league = mockIDBLeague();
});
afterAll(() => {
	resetG();
});

for (const playIn of [true, false]) {
	for (const draftType of ["nba2019", "nba2027"] as const) {
		test(`${draftType}, ${playIn ? "with" : "without"} play-in`, async () => {
			g.setWithoutSavingToDB("playIn", playIn);

			const teams = getTeams();
			const probs = await getFirstRoundSlotProbs({
				teams,
				draftType,
				numSims: NUM_SIMS,
			});

			// Each team is in exactly one slot in each simulation
			assert.strictEqual(probs.size, teams.length);
			for (const row of probs.values()) {
				assert.strictEqual(row.length, teams.length);
				assert.closeTo(sum(row), 1, 1e-9);
			}

			// Each slot has exactly one team in each simulation
			for (let slot = 0; slot < teams.length; slot++) {
				assert.closeTo(
					sum(Array.from(probs.values(), (row) => row[slot]!)),
					1,
					1e-9,
				);
			}

			// Same inputs give the same output
			const probs2 = await getFirstRoundSlotProbs({
				teams,
				draftType,
				numSims: NUM_SIMS,
			});
			assert.deepStrictEqual(probs2, probs);

			// 16 teams make the playoffs, and there is a smooth transition between teams projected to make it and teams projected to miss it
			const teamsSorted = teams.toSorted((a, b) => a.winp - b.winp);
			const probsNoPlayoffs = teamsSorted.map((t) =>
				sum(probs.get(t.tid)!.slice(0, 14)),
			);
			assert.isAbove(probsNoPlayoffs[0]!, 0.9);
			assert.isBelow(probsNoPlayoffs.at(-1)!, 0.1);
			assert.isAbove(probsNoPlayoffs[13]!, 0.3);
			assert.isBelow(probsNoPlayoffs[13]!, 0.7);
			assert.isAbove(probsNoPlayoffs[14]!, 0.3);
			assert.isBelow(probsNoPlayoffs[14]!, 0.7);
		});
	}
}

test("teams that already clinched can't change", async () => {
	g.setWithoutSavingToDB("playIn", false);

	// All teams are projected to be about the same, but one has already won enough games to be the best team and one has already lost enough to be the worst
	const teams = getTeams().map((t) => {
		return {
			...t,
			winp: 0.5,
			winpMin: 0.3,
			winpMax: 0.7,
		};
	});
	teams[3] = {
		...teams[3]!,
		winp: 0.8,
		winpMin: 0.75,
		winpMax: 0.85,
	};
	teams[4] = {
		...teams[4]!,
		winp: 0.2,
		winpMin: 0.15,
		winpMax: 0.25,
	};

	const probs = await getFirstRoundSlotProbs({
		teams,
		draftType: "nba2019",
		numSims: NUM_SIMS,
	});

	assert.strictEqual(probs.get(teams[3]!.tid)!.at(-1), 1);
	assert.strictEqual(probs.get(teams[4]!.tid)![0], 1);
});

test("teams with no draft pick are not in the draft order", async () => {
	g.setWithoutSavingToDB("playIn", false);

	const teams = getTeams().map((t, i) => {
		return {
			...t,
			noDraftPick: i === 0,
		};
	});

	const probs = await getFirstRoundSlotProbs({
		teams,
		draftType: "nba2019",
		numSims: NUM_SIMS,
	});

	assert.strictEqual(probs.size, teams.length - 1);
	assert.isFalse(probs.has(teams[0]!.tid));
	for (const row of probs.values()) {
		assert.strictEqual(row.length, teams.length - 1);
		assert.closeTo(sum(row), 1, 1e-9);
	}
});
