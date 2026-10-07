import { afterAll, assert, beforeAll, test } from "vitest";
import { mockIDBLeague, resetCache, resetG } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { getFirstRoundSlotProbs } from "./getFirstRoundSlotProbs.ts";

const NUM_SIMS = 500;

const NUM_GAMES = 82;

// Record so far this season, with some number of wins and losses
const getTeamSeason = (
	t: { tid: number; cid: number; did: number },
	won: number,
	lost: number,
) => {
	return {
		tid: t.tid,
		cid: t.cid,
		did: t.did,
		won,
		lost,
		otl: 0,
		tied: 0,
		wonDiv: 0,
		lostDiv: 0,
		otlDiv: 0,
		tiedDiv: 0,
		wonConf: 0,
		lostConf: 0,
		otlConf: 0,
		tiedConf: 0,
	};
};

// Before the season starts. Projected winp evenly spaced from 25% to 75%, with teams from both conferences mixed throughout
const getTeams = () => {
	return helpers.getTeamsDefault().map((t, i, teams) => {
		return {
			teamSeason: getTeamSeason(t, 0, 0),
			gamesLeft: NUM_GAMES,
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
				sum(probs.get(t.teamSeason.tid)!.slice(0, 14)),
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

	// With 7 games left, all teams are about the same, except one has already won enough games to be the best team and one has already lost enough to be the worst
	const gamesLeft = 7;
	const teams = helpers.getTeamsDefault().map((t, i) => {
		let won = 37;
		if (i === 3) {
			won = 70;
		} else if (i === 4) {
			won = 5;
		}

		return {
			teamSeason: getTeamSeason(t, won, NUM_GAMES - gamesLeft - won),
			gamesLeft,
			winp: 0.5,
			winpStd: 0.2,
		};
	});

	const probs = await getFirstRoundSlotProbs({
		teams,
		draftType: "nba2019",
		numSims: NUM_SIMS,
	});

	assert.strictEqual(probs.get(teams[3]!.teamSeason.tid)!.at(-1), 1);
	assert.strictEqual(probs.get(teams[4]!.teamSeason.tid)![0], 1);
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
	assert.isFalse(probs.has(teams[0]!.teamSeason.tid));
	for (const row of probs.values()) {
		assert.strictEqual(row.length, teams.length - 1);
		assert.closeTo(sum(row), 1, 1e-9);
	}
});

test("standings are based on points when there is a points formula", async () => {
	g.setWithoutSavingToDB("playIn", false);

	// Season is over. One team has the fewest wins, but with overtime losses it has more points than a few other teams
	const teams = helpers.getTeamsDefault().map((t, i) => {
		const teamSeason = getTeamSeason(t, 20 + i, NUM_GAMES - 20 - i);
		if (i === 0) {
			teamSeason.lost -= 30;
			teamSeason.otl += 30;
		}

		return {
			teamSeason,
			gamesLeft: 0,
			winp: 0.5,
			winpStd: 0.1,
		};
	});
	const tid = teams[0]!.teamSeason.tid;

	const getSlot = async () => {
		const probs = await getFirstRoundSlotProbs({
			teams,
			draftType: "noLottery",
			numSims: NUM_SIMS,
		});
		return probs.get(tid)!.indexOf(1);
	};

	// Worst team by winning percentage
	assert.strictEqual(await getSlot(), 0);

	// 20 wins and 30 overtime losses is 70 points, same as 35 wins. So it's ahead of the 14 teams with fewer than 35 wins
	g.setWithoutSavingToDB("pointsFormula", "2*W+OTL+T");
	assert.isAtLeast(await getSlot(), 14);
	g.setWithoutSavingToDB("pointsFormula", "");
});
