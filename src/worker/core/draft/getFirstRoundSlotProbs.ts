import type { DraftType, PlayInTournament } from "../../../common/types.ts";
import { g } from "../../util/index.ts";
import { genPlayoffSeriesFromTeams } from "../season/genPlayoffSeries.ts";
import getPlayoffsByConf from "../season/getPlayoffsByConf.ts";
import { getFirstRoundTeams, getNba2027PlayIn } from "./getTeamsByRound.ts";

const DEFAULT_NUM_SIMS = 2000;

// Upper bound on play-in games per simulated season (3 per conference)
const MAX_PLAY_IN_GAMES = 48;

// Small seeded random number generator (mulberry32), returns numbers in [0, 1)
const makeRandom = (seed: number) => {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

// The random numbers are always the same, so the same inputs always produce the same output. Otherwise the value of a draft pick would change every time it's evaluated.
let randomNumbersCache:
	| {
			numSims: number;
			numTeams: number;
			normals: Float64Array;
			uniforms: Float64Array;
	  }
	| undefined;
const getRandomNumbers = (numSims: number, numTeams: number) => {
	if (
		randomNumbersCache?.numSims === numSims &&
		randomNumbersCache.numTeams === numTeams
	) {
		return randomNumbersCache;
	}

	const random = makeRandom(1);

	const normals = new Float64Array(numSims * numTeams);
	for (let i = 0; i < normals.length; i++) {
		// Box-Muller transform
		const u1 = Math.max(random(), Number.MIN_VALUE);
		const u2 = random();
		normals[i] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	}

	const uniforms = new Float64Array(numSims * MAX_PLAY_IN_GAMES);
	for (let i = 0; i < uniforms.length; i++) {
		uniforms[i] = random();
	}

	randomNumbersCache = {
		numSims,
		numTeams,
		normals,
		uniforms,
	};

	return randomNumbersCache;
};

// Simulate the play-in tournament, assuming all games are coin flips. Returns the tids of the 2 teams that make the playoffs, and marks the result of the 7/8 game in playIn the same way a real game would, because nba2027 depends on it
const simPlayIn = (playIn: PlayInTournament, getUniform: () => number) => {
	const game78 = playIn[0];
	const game910 = playIn[1];

	let winner78 = game78.home;
	let loser78 = game78.away;
	if (getUniform() < 0.5) {
		winner78 = game78.away;
		loser78 = game78.home;
	}
	winner78.won = 1;

	const winner910 = getUniform() < 0.5 ? game910.home : game910.away;

	const winnerLast = getUniform() < 0.5 ? loser78 : winner910;

	return [winner78.tid, winnerLast.tid];
};

/**
 * Before the regular season is over, we don't know the order of teams going into the draft lottery. This estimates it by simulating the rest of the season many times, using the real rules for playoff qualification and draft order.
 *
 * Returns the probability of each team being in each slot of the first round order before the lottery (so index 0 is the team with the best lottery odds).
 */
export const getFirstRoundSlotProbs = async ({
	teams,
	draftType,
	numSims = DEFAULT_NUM_SIMS,
}: {
	teams: {
		tid: number;
		cid: number;
		did: number;

		// Projected final winning percentage, and uncertainty in it
		winp: number;
		winpStd: number;
	}[];
	draftType: DraftType;
	numSims?: number;
}) => {
	const numTeams = teams.length;
	const numGames = g.get("numGames");
	const byConf = await getPlayoffsByConf(g.get("season"));
	const { normals, uniforms } = getRandomNumbers(numSims, numTeams);

	const simTeams = teams.map((t) => {
		return {
			tid: t.tid,
			seasonAttrs: {
				cid: t.cid,
				did: t.did,
				winp: 0,
				pts: 0,
				won: 0,
				lost: 0,
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

				// This makes all playoff teams be ordered by record, even in sports where the real draft order depends on playoff results
				playoffRoundsWon: -1,
			},
			stats: {
				playoffs: false,
				gp: numGames,
				pts: 0,
				oppPts: 0,
			},
		};
	});

	const indexesByTid = new Map<number, number>();
	const counts: number[][] = [];
	for (const [i, t] of teams.entries()) {
		indexesByTid.set(t.tid, i);
		counts.push(new Array(numTeams).fill(0));
	}

	for (let sim = 0; sim < numSims; sim++) {
		for (let i = 0; i < numTeams; i++) {
			const t = teams[i]!;
			const seasonAttrs = simTeams[i]!.seasonAttrs;
			const winp = t.winp + t.winpStd * normals[sim * numTeams + i]!;
			seasonAttrs.winp = winp;
			seasonAttrs.won = winp * numGames;
			seasonAttrs.lost = numGames - seasonAttrs.won;

			// Not real points, but order is the same
			seasonAttrs.pts = seasonAttrs.won;
		}

		const { playIns, tidPlayoffs } = await genPlayoffSeriesFromTeams(simTeams, {
			byConf,
			skipTiebreakers: true,
		});

		if (playIns) {
			let uniformIndex = sim * MAX_PLAY_IN_GAMES;
			const getUniform = () => {
				const uniform = uniforms[uniformIndex]!;
				uniformIndex += 1;
				return uniform;
			};
			for (const playIn of playIns) {
				tidPlayoffs.push(...simPlayIn(playIn, getUniform));
			}
		}

		const { firstRound } = await getFirstRoundTeams({
			allTeams: simTeams,
			teams: simTeams,
			draftType,
			tidPlayoffs,
			nba2027PlayIn:
				draftType === "nba2027" ? getNba2027PlayIn(playIns) : undefined,
			orderTeamsSettings: {
				skipTiebreakers: true,
			},
		});

		for (const [slot, t] of firstRound.entries()) {
			counts[indexesByTid.get(t.tid)!]![slot]! += 1;
		}
	}

	const probs = new Map<number, number[]>();
	for (const [i, t] of teams.entries()) {
		probs.set(
			t.tid,
			counts[i]!.map((count) => count / numSims),
		);
	}

	return probs;
};
