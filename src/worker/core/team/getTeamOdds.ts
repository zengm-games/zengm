import { PHASE } from "../../../common/constants.ts";
import { makeSeededRandom, realGauss } from "../../../common/random.ts";
import { bySport } from "../../../common/sportFunctions.ts";
import type {
	PlayInTournament,
	PlayoffSeries,
	PlayoffSeriesTeam,
	TeamSeason,
} from "../../../common/types.ts";
import { makeGetPregameWinProbability } from "../../../common/gamePrediction.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { getDivisionRanks } from "../../util/orderTeams.ts";
import { getActualPlayThroughInjuries } from "../game/loadTeams.ts";
import player from "../player/index.ts";
import {
	genPlayoffSeriesFromTeams,
	InvalidPlayoffSettingsError,
} from "../season/genPlayoffSeries.ts";
import addDaysToSchedule from "../season/addDaysToSchedule.ts";
import getSchedule from "../season/getSchedule.ts";
import { addSpecialGames, genScheduleMatchups } from "../season/newSchedule.ts";
import getPlayoffsByConf from "../season/getPlayoffsByConf.ts";
import {
	betterSeedHome,
	getNextRoundMatchups,
	getPlayInFinalGame,
	getPlayInTargetTid,
	getPlayInWinnerLoser,
	placePlayInWinner,
} from "../season/playoffBracket.ts";
import {
	getHypotheticalTeam,
	type TeamSeasonRecord,
} from "./getHypotheticalTeam.ts";
import ovr from "./ovr.ts";

// Fewer sims make the odds noisier, about 1.4 percentage points RMS error in playoff odds at 1000 and 2.8 at 250
const MAX_NUM_SIMS = 1000;
const MIN_NUM_SIMS = 250;

// Run time is proportional to the number of sims times this work, which is mostly simulating regular season games, plus some per team work like playoff seeding that costs about as much as 10 games. This budget is enough for MAX_NUM_SIMS in a 30 team league with a 162 game season, and big leagues get fewer sims so updating the odds after every day doesn't get too slow.
const WORK_BUDGET = 3_000_000;
export const getNumSims = (numRemainingGames: number, numTeams: number) => {
	const workPerSim = numRemainingGames + 10 * numTeams;
	return helpers.bound(
		Math.floor(WORK_BUDGET / Math.max(workPerSim, 1)),
		MIN_NUM_SIMS,
		MAX_NUM_SIMS,
	);
};

// Clinched at least a spot in the playoffs proper, not just the play-in
const CLINCHED_PLAYOFFS = new Set<TeamSeason["clinchedPlayoffs"]>([
	"x",
	"y",
	"z",
]);

// How far a team's true strength can be from its ovr, in ovr points. Measured from how far season MOV is from what preseason ovr predicts, after taking out single game noise. One value is drawn per team per sim and used for all of its games, otherwise the best team wins too often, since it never has a bad season or a bad playoff run.
const STRENGTH_STD = bySport({
	baseball: 5.5,
	basketball: 8,
	football: 8,
	hockey: 11,
});

// A team's ovr by day, which only changes when an injured player gets healthier. ovr is for today, and each change applies from its day on, counting days from today.
export type OvrByDay = {
	changes: { day: number; ovr: number }[];
	ovr: number;
};

export const getOvrOnDay = ({ changes, ovr }: OvrByDay, day: number) => {
	let ovrOnDay = ovr;
	for (const change of changes) {
		if (change.day > day) {
			break;
		}
		ovrOnDay = change.ovr;
	}
	return ovrOnDay;
};

type TeamOddsTeam = {
	clinchedPlayoffs?: TeamSeason["clinchedPlayoffs"];

	// For playoff games. Regular season games have their own ovrs in RemainingGame.
	playoffsOvrs: OvrByDay;

	teamSeason: TeamSeasonRecord;
};

// A regular season game left, with each team's ovr on the day of the game, since injured players heal during the season
export type RemainingGame = {
	away: number;
	awayOvr: number;
	home: number;
	homeOvr: number;
};

// resolved means prob comes from the state of the game, not from a simulation
type Odds = { prob: number; resolved?: boolean };

export type TeamOdds = Record<number, { playoffs: Odds; title: Odds }>;

type Bracket = Pick<PlayoffSeries, "currentRound" | "playIns" | "series">;

type PlayInGame = PlayInTournament[number];

type Matchup = Bracket["series"][number][number];

type SimInfo = {
	byConf: number | false;
	// day is days from today
	getGameProb: (
		home: number,
		away: number,
		neutral: boolean,
		day: number,
	) => number;

	numDaysUntilPlayoffs: number;
	numGamesPlayoffSeries: number[];
	random: () => number;

	// Higher is better. For when the seeds of 2 teams are not comparable.
	recordScores: Map<number, number>;

	season: number;
};

// Probability that home wins a series, given the current number of wins for each team. getProbHomeWins is the probability that home wins a game, by the number of games already played in the series.
const getSeriesProb = ({
	awayWon,
	getProbHomeWins,
	homeWon,
	numGamesToWin,
}: {
	awayWon: number;
	getProbHomeWins: (gameIndex: number) => number;
	homeWon: number;
	numGamesToWin: number;
}) => {
	// Each game's probability is used by several states of the series, so compute each one once
	const probsByGame: number[] = [];
	const getProb = (gameIndex: number) => {
		let prob = probsByGame[gameIndex];
		if (prob === undefined) {
			prob = getProbHomeWins(gameIndex);
			probsByGame[gameIndex] = prob;
		}
		return prob;
	};

	// probs[homeWins][awayWins]
	const probs: number[][] = [];
	for (let i = numGamesToWin; i >= homeWon; i--) {
		probs[i] = [];
	}

	for (let i = numGamesToWin - 1; i >= homeWon; i--) {
		for (let j = numGamesToWin - 1; j >= awayWon; j--) {
			const prob = getProb(i + j);
			const ifWin = i + 1 === numGamesToWin ? 1 : probs[i + 1]![j]!;
			const ifLose = j + 1 === numGamesToWin ? 0 : probs[i]![j + 1]!;
			probs[i]![j] = prob * ifWin + (1 - prob) * ifLose;
		}
	}

	return probs[homeWon]![awayWon]!;
};

const isNeutral = (numMatchups: number) => {
	const neutralSite = g.get("neutralSite");
	return (
		neutralSite === "playoffs" ||
		(neutralSite === "finals" && numMatchups === 1)
	);
};

const isPlayed = (game: PlayInGame | undefined) =>
	game !== undefined && game.home.won + game.away.won > 0;

// The first 2 games of each play-in are on the first day, and the last game is on the next day
const getNumPlayInDaysLeft = (bracket: Bracket) => {
	if (bracket.currentRound !== -1 || !bracket.playIns) {
		return 0;
	}
	if (
		bracket.playIns.some(
			(playIn) => !isPlayed(playIn[0]) || !isPlayed(playIn[1]),
		)
	) {
		return 2;
	}
	if (bracket.playIns.some((playIn) => !isPlayed(playIn[2]))) {
		return 1;
	}
	return 0;
};

const simPlayIns = (bracket: Bracket, info: SimInfo) => {
	const neutral = g.get("neutralSite") === "playoffs";
	const numDaysLeft = getNumPlayInDaysLeft(bracket);

	// Returns a copy of the game with the winner decided, if it was not already played
	const playGame = (game: PlayInGame, day: number): PlayInGame => {
		if (isPlayed(game)) {
			return game;
		}
		const homeWins =
			info.random() <
			info.getGameProb(
				game.home.tid,
				game.away.tid,
				neutral,
				info.numDaysUntilPlayoffs + day,
			);
		return homeWins
			? { ...game, home: { ...game.home, won: 1 } }
			: { ...game, away: { ...game.away, won: 1 } };
	};

	const firstRound = bracket.series[0]!.map((matchup) => ({ ...matchup }));
	for (const playIn of bracket.playIns ?? []) {
		const played: PlayInTournament = [
			playGame(playIn[0], 0),
			playGame(playIn[1], 0),
		];
		played.push(
			playGame(playIn[2] ?? getPlayInFinalGame(played), numDaysLeft - 1),
		);

		for (const [gameIndex, game] of played.entries()) {
			const targetTid = getPlayInTargetTid(played, gameIndex);
			if (targetTid !== undefined) {
				placePlayInWinner(
					firstRound,
					targetTid,
					getPlayInWinnerLoser(game).winner,
				);
			}
		}
	}

	return firstRound;
};

// The first round of the bracket that still needs to be played, after simulating any remaining play-in games, and the number of days from today until that round started or starts. This only reads bracket, so the same one can be used for every sim.
const getStartingMatchups = (bracket: Bracket, info: SimInfo) => {
	return {
		day: info.numDaysUntilPlayoffs + getNumPlayInDaysLeft(bracket),
		matchups:
			bracket.currentRound === -1
				? simPlayIns(bracket, info)
				: bracket.series[bracket.currentRound]!,
		round: Math.max(bracket.currentRound, 0),
	};
};

// Returns the tid of the champion. startingDay is the number of days from today until the next game of startingMatchups.
const simBracket = async (
	startingMatchups: Matchup[],
	startingRound: number,
	startingDay: number,
	info: SimInfo,
) => {
	const { byConf, getGameProb, numGamesPlayoffSeries, random, season } = info;

	// After the conference rounds, seeds from different conferences are not comparable, so use the simulated records
	const getRecordScore = (t: PlayoffSeriesTeam) =>
		info.recordScores.get(t.tid) ?? 0;
	const orderAcrossConfs = (teams: PlayoffSeriesTeam[]) =>
		teams.toSorted((a, b) => getRecordScore(b) - getRecordScore(a));

	let round = startingRound;
	let matchups = startingMatchups;
	let day = startingDay;

	while (true) {
		const neutral = isNeutral(matchups.length);
		const numGamesToWin = helpers.numGamesToWinRound(round, season);
		const numGames = numGamesPlayoffSeries[round]!;

		// Every series that is still going plays one game per day, and the next round starts once they are all done. This assumes the longest series goes the distance.
		let numDaysInRound = 0;

		const winners = matchups.map(({ home, away }) => {
			if (!away || home.won >= numGamesToWin) {
				return home;
			}
			if (away.won >= numGamesToWin) {
				return away;
			}

			const numGamesPlayed = home.won + away.won;
			numDaysInRound = Math.max(
				numDaysInRound,
				2 * numGamesToWin - 1 - numGamesPlayed,
			);

			const prob = getSeriesProb({
				awayWon: away.won,
				getProbHomeWins: (gameIndex) => {
					const gameDay = day + gameIndex - numGamesPlayed;
					return betterSeedHome(numGames, gameIndex)
						? getGameProb(home.tid, away.tid, neutral, gameDay)
						: 1 - getGameProb(away.tid, home.tid, neutral, gameDay);
				},
				homeWon: home.won,
				numGamesToWin,
			});
			return random() < prob ? home : away;
		});
		day += numDaysInRound;

		if (winners.length <= 1) {
			return winners[0]?.tid;
		}

		matchups = (
			await getNextRoundMatchups({
				orderAcrossConfs,
				playoffsByConf: byConf,
				reseed: g.get("playoffsReseed"),
				teamsWon: winners,
			})
		).map(({ home, away }) => ({
			home: { ...home, won: 0 },
			away: { ...away, won: 0 },
		}));
		round += 1;
	}
};

// A team in one simulated season. These are reused for every sim and referenced directly by the grouped games, rather than looked up in maps by tid, because the regular season loop is the slowest part.
type SimTeamState = {
	lost: number;

	// How much better or worse than its ovr the team is in this sim
	strengthOffset: number;

	won: number;
};

// Teams play each other more than once, and a team's ovr only changes when an injured player gets healthier, so this avoids computing the same win probability again for every game
const groupRemainingGames = (
	remainingGames: readonly RemainingGame[],
	simStates: Map<number, SimTeamState>,
) => {
	const matchups = new Map<
		string,
		{
			away: SimTeamState;
			awayOvr: number;
			home: SimTeamState;
			homeOvr: number;
			numGames: number;
		}
	>();

	const getState = (tid: number) => {
		const state = simStates.get(tid);
		if (!state) {
			throw new Error(`Remaining game for team ${tid}, which is not in teams`);
		}
		return state;
	};

	for (const game of remainingGames) {
		const key = `${game.home},${game.away},${game.homeOvr},${game.awayOvr}`;
		const matchup = matchups.get(key);
		if (matchup) {
			matchup.numGames += 1;
		} else {
			matchups.set(key, {
				away: getState(game.away),
				awayOvr: game.awayOvr,
				home: getState(game.home),
				homeOvr: game.homeOvr,
				numGames: 1,
			});
		}
	}
	return [...matchups.values()];
};

// Everyone in these matchups, including teams with a bye
const getFirstRoundTids = (matchups: Matchup[]) => {
	const tids = new Set<number>();
	for (const { home, away } of matchups) {
		tids.add(home.tid);
		if (away) {
			tids.add(away.tid);
		}
	}
	return tids;
};

const getChampion = (bracket: Bracket, season: number) => {
	const lastRound = bracket.series.length - 1;
	const finals = bracket.series[lastRound]?.[0];
	if (!finals?.away) {
		return;
	}

	const numGamesToWin = helpers.numGamesToWinRound(lastRound, season);
	if (finals.home.won >= numGamesToWin) {
		return finals.home.tid;
	}
	if (finals.away.won >= numGamesToWin) {
		return finals.away.tid;
	}
};

// Teams that can still win the title
const getAliveTids = (bracket: Bracket, season: number) => {
	const alive = new Set<number>();

	if (bracket.currentRound === -1) {
		for (const { home, away } of bracket.series[0]!) {
			for (const t of [home, away]) {
				if (t && !t.pendingPlayIn) {
					alive.add(t.tid);
				}
			}
		}

		for (const playIn of bracket.playIns ?? []) {
			for (const { home, away } of playIn) {
				alive.add(home.tid);
				alive.add(away.tid);
			}
			// Losing the game between the bottom 2 teams or the last game is elimination
			for (const game of [playIn[1], playIn[2]]) {
				if (game && game.home.won + game.away.won > 0) {
					alive.delete(getPlayInWinnerLoser(game).loser.tid);
				}
			}
		}

		return alive;
	}

	const numGamesToWin = helpers.numGamesToWinRound(
		bracket.currentRound,
		season,
	);
	for (const { home, away } of bracket.series[bracket.currentRound]!) {
		if (!away || away.won < numGamesToWin) {
			alive.add(home.tid);
		}
		if (away && home.won < numGamesToWin) {
			alive.add(away.tid);
		}
	}
	return alive;
};

/**
 * Simulates the rest of the season and the playoffs many times, or just the rest of the playoffs if playoffSeries is supplied.
 *
 * Unlike getFirstRoundSlotProbs, this needs to play out the bracket, and the size of the gaps between teams matter for that, so it does not share that code.
 *
 * Returns undefined if the playoff settings are not valid for these teams.
 */
export const simTeamOdds = async ({
	numDaysUntilPlayoffs,
	numSims: numSimsOverride,
	playoffSeries,
	remainingGames,
	season,
	teams,
}: {
	// 0 if the playoffs already started
	numDaysUntilPlayoffs: number;

	// Defaults to as many as the work budget allows
	numSims?: number;
	playoffSeries?: Bracket;

	remainingGames: readonly RemainingGame[];

	season: number;
	teams: TeamOddsTeam[];
}): Promise<TeamOdds | undefined> => {
	// Teams that are sure to be in the playoffs, and teams that still might be
	let clinchedTids;
	let playoffsAliveTids;
	if (playoffSeries) {
		clinchedTids = getFirstRoundTids(
			playoffSeries.series[0]!.map(({ home, away }) => ({
				home,
				away: away?.pendingPlayIn ? undefined : away,
			})),
		);
		playoffsAliveTids = new Set([
			...clinchedTids,
			...getAliveTids(playoffSeries, season),
		]);
	} else {
		clinchedTids = new Set(
			teams
				.filter(({ clinchedPlayoffs }) =>
					CLINCHED_PLAYOFFS.has(clinchedPlayoffs),
				)
				.map((t) => t.teamSeason.tid),
		);
		playoffsAliveTids = new Set(
			teams
				.filter((t) => t.clinchedPlayoffs !== "o")
				.map((t) => t.teamSeason.tid),
		);
	}
	const getPlayoffsOdds = (tid: number, count: number, numCounted: number) => {
		if (clinchedTids.has(tid)) {
			return { prob: 1, resolved: true };
		}
		if (!playoffsAliveTids.has(tid)) {
			return { prob: 0, resolved: true };
		}
		return { prob: count / Math.max(numCounted, 1) };
	};

	const champion = playoffSeries
		? getChampion(playoffSeries, season)
		: undefined;
	if (champion !== undefined) {
		const odds: TeamOdds = {};
		for (const { teamSeason } of teams) {
			const { tid } = teamSeason;
			odds[tid] = {
				playoffs: getPlayoffsOdds(tid, 0, 0),
				title: { prob: tid === champion ? 1 : 0, resolved: true },
			};
		}
		return odds;
	}

	const usePts = g.get("pointsFormula", season) !== "";
	const byConf = await getPlayoffsByConf(season);
	const needDivisionRanks = g.get("playoffsNumTeamsDiv", season) > 0;
	const numGamesPlayoffSeries = g.get("numGamesPlayoffSeries", season);
	const gameInfo = {
		homeCourtAdvantage: g.get("homeCourtAdvantage"),
		numPeriods: g.get("numPeriods"),
		quarterLength: g.get("quarterLength"),
	};

	if (!playoffSeries) {
		try {
			await genPlayoffSeriesFromTeams(
				teams.map((t) =>
					getHypotheticalTeam({
						teamSeason: t.teamSeason,
						won: 0,
						lost: 0,
						usePts,
					}),
				),
				{ byConf, season, skipTiebreakers: true },
			);
		} catch (error) {
			if (error instanceof InvalidPlayoffSettingsError) {
				return;
			}
			throw error;
		}
	}

	const aliveTids = playoffSeries
		? getAliveTids(playoffSeries, season)
		: playoffsAliveTids;

	const numSims =
		numSimsOverride ?? getNumSims(remainingGames.length, teams.length);
	const random = makeSeededRandom(1);
	const avgOvr =
		teams.reduce((sum, t) => sum + t.playoffsOvrs.ovr, 0) /
		Math.max(teams.length, 1);
	const playoffsOvrs = new Map(
		teams.map((t) => [t.teamSeason.tid, t.playoffsOvrs]),
	);

	const recordScores = new Map<number, number>();
	for (const { teamSeason } of teams) {
		const { pts, winp } = getHypotheticalTeam({
			teamSeason,
			won: 0,
			lost: 0,
			usePts,
		}).seasonAttrs;
		recordScores.set(teamSeason.tid, usePts ? pts : winp);
	}

	const simStates = new Map<number, SimTeamState>(
		teams.map((t) => [
			t.teamSeason.tid,
			{ lost: 0, strengthOffset: 0, won: 0 },
		]),
	);
	const remainingMatchups = groupRemainingGames(remainingGames, simStates);

	const playoffsCounts = new Map<number, number>();
	const titleCounts = new Map<number, number>();
	let numTitlesCounted = 0;

	const getProb = makeGetPregameWinProbability(gameInfo);

	for (let sim = 0; sim < numSims; sim++) {
		for (const state of simStates.values()) {
			state.lost = 0;
			state.strengthOffset = realGauss(0, STRENGTH_STD, random);
			state.won = 0;
		}

		const getPlayoffsStrength = (tid: number, day: number) => {
			const ovrs = playoffsOvrs.get(tid);
			return (
				(ovrs ? getOvrOnDay(ovrs, day) : avgOvr) +
				(simStates.get(tid)?.strengthOffset ?? 0)
			);
		};

		const getGameProb = (
			home: number,
			away: number,
			neutral: boolean,
			day: number,
		) => {
			return getProb(
				getPlayoffsStrength(home, day),
				getPlayoffsStrength(away, day),
				neutral,
			);
		};

		const info = {
			byConf,
			getGameProb,
			numDaysUntilPlayoffs,
			numGamesPlayoffSeries,
			random,
			recordScores,
			season,
		};

		let bracket = playoffSeries;
		if (!bracket) {
			for (const {
				away,
				awayOvr,
				home,
				homeOvr,
				numGames,
			} of remainingMatchups) {
				const prob = getProb(
					homeOvr + home.strengthOffset,
					awayOvr + away.strengthOffset,
					false,
				);
				let homeWins = 0;
				for (let i = 0; i < numGames; i++) {
					if (random() < prob) {
						homeWins += 1;
					}
				}
				const awayWins = numGames - homeWins;
				home.won += homeWins;
				home.lost += awayWins;
				away.won += awayWins;
				away.lost += homeWins;
			}

			// Tiebreakers are skipped, which leaves tied teams in this order, so shuffle it
			const simTeams = teams
				.map(({ teamSeason }) => ({ teamSeason, tieOrder: random() }))
				.sort((a, b) => a.tieOrder - b.tieOrder)
				.map(({ teamSeason }) => {
					const simTeam = getHypotheticalTeam({
						teamSeason,
						won: simStates.get(teamSeason.tid)?.won ?? 0,
						lost: simStates.get(teamSeason.tid)?.lost ?? 0,
						usePts,
					});

					const { pts, winp } = simTeam.seasonAttrs;
					recordScores.set(teamSeason.tid, usePts ? pts : winp);

					return simTeam;
				});

			const divisionRanks = needDivisionRanks
				? await getDivisionRanks(simTeams, simTeams, {
						season,
						skipTiebreakers: true,
					})
				: undefined;

			const generated = await genPlayoffSeriesFromTeams(simTeams, {
				byConf,
				divisionRanks,
				season,
				skipTiebreakers: true,
			});
			info.byConf = generated.byConf;
			bracket = {
				currentRound: generated.playIns ? -1 : 0,
				playIns: generated.playIns,
				series: generated.series,
			};
		}

		const { day, matchups, round } = getStartingMatchups(bracket, info);
		for (const tid of getFirstRoundTids(matchups)) {
			playoffsCounts.set(tid, (playoffsCounts.get(tid) ?? 0) + 1);
		}

		const champ = await simBracket(matchups, round, day, info);
		if (champ !== undefined && aliveTids.has(champ)) {
			titleCounts.set(champ, (titleCounts.get(champ) ?? 0) + 1);
			numTitlesCounted += 1;
		}
	}

	const odds: TeamOdds = {};
	for (const { teamSeason } of teams) {
		const { tid } = teamSeason;
		odds[tid] = {
			playoffs: getPlayoffsOdds(tid, playoffsCounts.get(tid) ?? 0, numSims),
			title: aliveTids.has(tid)
				? {
						prob: (titleCounts.get(tid) ?? 0) / Math.max(numTitlesCounted, 1),
					}
				: { prob: 0, resolved: true },
		};
	}

	return odds;
};

export const getTeamStrength = (
	players: Parameters<typeof ovr>[0],
	{
		numDaysInFuture,
		playoffs,
		t,
	}: {
		numDaysInFuture: number;
		playoffs: boolean;
		t: Parameters<typeof getActualPlayThroughInjuries>[0];
	},
) => {
	return ovr(players, {
		accountForInjuredPlayers: {
			numDaysInFuture,
			playThroughInjuries: getActualPlayThroughInjuries(t),
		},
		playoffs,
	});
};

// Cheap enough to call when loading a view. If this is true, title odds may still be undefined for invalid playoff settings.
export const isTeamOddsAvailable = (season: number) => {
	return (
		season === g.get("season") &&
		g.get("phase") >= PHASE.PRESEASON &&
		g.get("numGamesPlayoffSeries", season).length > 0
	);
};

// A team's ovr only changes on the days when an injured player heals or gets closer to healing while playing through the injury, so it is only computed on those days
export const getOvrsByDay = (
	players: Parameters<typeof getTeamStrength>[0],
	{
		playoffs,
		t,
	}: {
		playoffs: boolean;
		t: Parameters<typeof getActualPlayThroughInjuries>[0];
	},
): OvrByDay => {
	const playThroughInjuries = getActualPlayThroughInjuries(t)[playoffs ? 1 : 0];
	const changeDays = new Set<number>();
	for (const p of players) {
		const { gamesRemaining } = p.injury;
		for (
			let day = gamesRemaining - playThroughInjuries;
			day <= gamesRemaining;
			day++
		) {
			if (day > 0) {
				changeDays.add(day);
			}
		}
	}

	const getOvr = (numDaysInFuture: number) =>
		getTeamStrength(players, { numDaysInFuture, playoffs, t });
	return {
		changes: [...changeDays]
			.sort((a, b) => a - b)
			.map((day) => ({ day, ovr: getOvr(day) })),
		ovr: getOvr(0),
	};
};

// Returns undefined if title odds can't be computed
export const getTeamOdds = async () => {
	const season = g.get("season");
	const phase = g.get("phase");

	let playoffSeries;
	if (phase >= PHASE.PLAYOFFS) {
		playoffSeries = await idb.cache.playoffSeries.get(season);
		if (!playoffSeries) {
			return;
		}
	}

	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[season], [season, "Z"]],
	);
	const teamsRaw = await idb.cache.teams.getAll();
	const teamsByTid = new Map(teamsRaw.map((t) => [t.tid, t]));

	const activeTeamSeasons = teamSeasons.filter(
		(teamSeason) => !teamsByTid.get(teamSeason.tid)?.disabled,
	);

	const schedule = await getRegularSeasonSchedule({
		phase,
		teamSeasons: activeTeamSeasons,
	});
	const today = schedule[0]?.day ?? 0;
	const lastDay = schedule.at(-1)?.day;
	const numDaysUntilPlayoffs = lastDay === undefined ? 0 : lastDay - today + 1;

	const players = await player.formatAll(
		await idb.cache.players.indexGetAll("playersByTid", [0, Infinity]),
		{
			attrs: ["injury", "pid", "value", "tid"],
			ratings: ["ovr", "pos", "ovrs"],
			season,
			fuzz: true,
		},
	);
	const playersByTid = Map.groupBy(players, (p) => p.tid);

	const regularSeasonOvrs = new Map<number, OvrByDay>();
	const teams = activeTeamSeasons.map((teamSeason) => {
		const { tid } = teamSeason;
		const teamPlayers = playersByTid.get(tid) ?? [];
		const t = teamsByTid.get(tid) ?? "default";

		regularSeasonOvrs.set(
			tid,
			getOvrsByDay(teamPlayers, { playoffs: false, t }),
		);

		return {
			clinchedPlayoffs: teamSeason.clinchedPlayoffs,
			playoffsOvrs: getOvrsByDay(teamPlayers, { playoffs: true, t }),
			teamSeason,
		};
	});

	const remainingGames: RemainingGame[] = [];
	for (const game of schedule) {
		// Skips special games like the All-Star Game, which have negative tids
		const homeOvrs = regularSeasonOvrs.get(game.homeTid);
		const awayOvrs = regularSeasonOvrs.get(game.awayTid);
		if (homeOvrs && awayOvrs) {
			const day = game.day - today;
			remainingGames.push({
				away: game.awayTid,
				awayOvr: getOvrOnDay(awayOvrs, day),
				home: game.homeTid,
				homeOvr: getOvrOnDay(homeOvrs, day),
			});
		}
	}

	return simTeamOdds({
		numDaysUntilPlayoffs,
		playoffSeries,
		remainingGames,
		season,
		teams,
	});
};

// The same schedule updateClinchedPlayoffs uses, so odds agree with what has been clinched. Before the regular season there is no schedule yet, so this generates one like the real one will be.
const getRegularSeasonSchedule = async ({
	phase,
	teamSeasons,
}: {
	phase: number;
	teamSeasons: TeamSeason[];
}): Promise<{ awayTid: number; day: number; homeTid: number }[]> => {
	if (phase === PHASE.PRESEASON) {
		const { tids } = genScheduleMatchups(
			teamSeasons.map(({ cid, did, tid }) => ({
				seasonAttrs: { cid, did },
				tid,
			})),
		);
		return addDaysToSchedule(
			addSpecialGames(tids).map(([homeTid, awayTid]) => ({
				awayTid,
				homeTid,
			})),
		);
	}

	if (phase === PHASE.REGULAR_SEASON || phase === PHASE.AFTER_TRADE_DEADLINE) {
		return await getSchedule();
	}

	return [];
};
