import { assert, describe, test } from "vitest";
import type {
	PlayInTournament,
	PlayoffSeriesTeam,
} from "../../../common/types.ts";
import {
	getNextRoundMatchups,
	getPlayInFinalGame,
	getPlayInTargetTid,
	placePlayInWinner,
} from "./playoffBracket.ts";

const team = (
	tid: number,
	seed: number,
	extra?: Partial<PlayoffSeriesTeam>,
): PlayoffSeriesTeam => ({ cid: 0, seed, tid, won: 0, ...extra });

const getTids = (
	matchups: { home: PlayoffSeriesTeam; away: PlayoffSeriesTeam }[],
) => matchups.map(({ home, away }) => [home.tid, away.tid]);

// Best first is lowest tid, so it's easy to tell apart from seed
const orderAcrossConfs = (teams: PlayoffSeriesTeam[]) =>
	teams.toSorted((a, b) => a.tid - b.tid);

describe("getNextRoundMatchups", () => {
	// Bracket order 1v8, 4v5, 2v7, 3v6 and seeds 1, 5, 7, 3 won
	const teamsWon = [team(0, 1), team(4, 5), team(6, 7), team(2, 3)];

	test("keeps bracket order without reseeding, better seed home", async () => {
		const matchups = await getNextRoundMatchups({
			orderAcrossConfs,
			playoffsByConf: false,
			reseed: false,
			teamsWon,
		});
		assert.deepEqual(getTids(matchups), [
			[0, 4],
			[2, 6],
		]);
	});

	test("reseeding pairs best with worst", async () => {
		const matchups = await getNextRoundMatchups({
			orderAcrossConfs,
			playoffsByConf: false,
			reseed: true,
			teamsWon,
		});
		assert.deepEqual(getTids(matchups), [
			[0, 6],
			[2, 4],
		]);
	});

	test("reseeding stays within each conference during conference rounds", async () => {
		const matchups = await getNextRoundMatchups({
			orderAcrossConfs,
			playoffsByConf: 2,
			reseed: true,
			teamsWon: [team(0, 4), team(1, 1), team(2, 2), team(3, 3)],
		});
		assert.deepEqual(getTids(matchups), [
			[1, 0],
			[2, 3],
		]);
	});

	test("across conferences, home team comes from orderAcrossConfs, not seed", async () => {
		const matchups = await getNextRoundMatchups({
			orderAcrossConfs,
			playoffsByConf: 2,
			reseed: false,
			teamsWon: [team(5, 1), team(3, 2)],
		});
		assert.deepEqual(getTids(matchups), [[3, 5]]);
	});
});

describe("play-in", () => {
	// 7 hosts 8, 9 hosts 10. 8 and 9 won.
	const playIn: PlayInTournament = [
		{ home: team(7, 7), away: team(8, 8, { won: 1, pts: 100 }) },
		{ home: team(9, 9, { won: 1, pts: 90 }), away: team(10, 10) },
	];

	test("final game is loser of top game hosting winner of bottom game, reset", () => {
		const { home, away } = getPlayInFinalGame(playIn);
		assert.strictEqual(home.tid, 7);
		assert.strictEqual(away.tid, 9);
		assert.strictEqual(away.won, 0);
		assert.isUndefined(away.pts);

		// Copies, so the original game is not changed
		assert.strictEqual(playIn[1].home.won, 1);
	});

	test("winners of the top game and the final game take the placeholder spots", () => {
		assert.strictEqual(getPlayInTargetTid(playIn, 0), 7);
		assert.isUndefined(getPlayInTargetTid(playIn, 1));
		assert.strictEqual(getPlayInTargetTid(playIn, 2), 8);
	});

	test("placePlayInWinner keeps the seed of the spot", () => {
		const firstRound = [
			{ home: team(1, 1), away: team(8, 8, { pendingPlayIn: true }) },
			{ home: team(2, 2), away: team(7, 7, { pendingPlayIn: true }) },
		];
		placePlayInWinner(firstRound, 7, team(8, 8, { won: 1 }));

		assert.strictEqual(firstRound[1]!.away.tid, 8);
		assert.strictEqual(firstRound[1]!.away.seed, 7);
		assert.strictEqual(firstRound[1]!.away.won, 0);
		assert.isUndefined(firstRound[1]!.away.pendingPlayIn);

		// The other spot is untouched
		assert.strictEqual(firstRound[0]!.away.tid, 8);
		assert.isTrue(firstRound[0]!.away.pendingPlayIn);
	});
});
