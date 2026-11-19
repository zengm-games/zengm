import { PHASE } from "../../../common/constants.ts";
import { makeSeededRandom, realGauss } from "../../../common/random.ts";
import { bySport } from "../../../common/sportFunctions.ts";
import type {
	PlayInTournament,
	PlayoffSeries,
	PlayoffSeriesTeam,
	TeamSeason,
} from "../../../common/types.ts";
import {
	getGamePrediction,
	getWinProbability,
} from "../../../common/gamePrediction.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { getDivisionRanks } from "../../util/orderTeams.ts";
import { getActualPlayThroughInjuries } from "../game/loadTeams.ts";
import player from "../player/index.ts";
import {
	genPlayoffSeriesFromTeams,
	InvalidPlayoffSettingsError,
} from "../season/genPlayoffSeries.ts";
import getDaysLeftSchedule from "../season/getDaysLeftSchedule.ts";
import { getGamesLeftSchedule } from "../season/getGamesLeftSchedule.ts";
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

const DEFAULT_NUM_SIMS = 1000;

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

type TeamOddsTeam = {
	clinchedPlayoffs?: TeamSeason["clinchedPlayoffs"];

	gamesLeft: number;
	ovr: number;
	teamSeason: TeamSeasonRecord;
};

// resolved means prob comes from the state of the game, not from a simulation
type Odds = { prob: number; resolved?: boolean };

export type TeamOdds = Record<number, { playoffs: Odds; title: Odds }>;

type Bracket = Pick<PlayoffSeries, "currentRound" | "playIns" | "series">;

type PlayInGame = PlayInTournament[number];

type Matchup = Bracket["series"][number][number];

type SimInfo = {
	byConf: number | false;
	getGameProb: (home: number, away: number, neutral: boolean) => number;
	numGamesPlayoffSeries: number[];
	random: () => number;

	// Higher is better. For when the seeds of 2 teams are not comparable.
	recordScores: Map<number, number>;

	season: number;
};

// Probability that home wins a series, given the current number of wins for each team. In each game, the team hosting depends on the number of games already played.
const getSeriesProb = ({
	awayWon,
	homeWon,
	numGames,
	numGamesToWin,
	probHomeWinsAtAway,
	probHomeWinsAtHome,
}: {
	awayWon: number;
	homeWon: number;
	numGames: number;
	numGamesToWin: number;
	probHomeWinsAtAway: number;
	probHomeWinsAtHome: number;
}) => {
	// probs[homeWins][awayWins]
	const probs: number[][] = [];
	for (let i = numGamesToWin; i >= homeWon; i--) {
		probs[i] = [];
	}

	for (let i = numGamesToWin - 1; i >= homeWon; i--) {
		for (let j = numGamesToWin - 1; j >= awayWon; j--) {
			const prob = betterSeedHome(numGames, i + j)
				? probHomeWinsAtHome
				: probHomeWinsAtAway;
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

const simPlayIns = (bracket: Bracket, info: SimInfo) => {
	const neutral = g.get("neutralSite") === "playoffs";

	// Returns a copy of the game with the winner decided, if it was not already played
	const playGame = (game: PlayInGame): PlayInGame => {
		if (game.home.won > 0 || game.away.won > 0) {
			return game;
		}
		const homeWins =
			info.random() < info.getGameProb(game.home.tid, game.away.tid, neutral);
		return homeWins
			? { ...game, home: { ...game.home, won: 1 } }
			: { ...game, away: { ...game.away, won: 1 } };
	};

	const firstRound = bracket.series[0]!.map((matchup) => ({ ...matchup }));
	for (const playIn of bracket.playIns ?? []) {
		const played: PlayInTournament = [playGame(playIn[0]), playGame(playIn[1])];
		played.push(playGame(playIn[2] ?? getPlayInFinalGame(played)));

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

// The first round of the bracket that still needs to be played, after simulating any remaining play-in games. This only reads bracket, so the same one can be used for every sim.
const getStartingMatchups = (bracket: Bracket, info: SimInfo) => {
	return {
		matchups:
			bracket.currentRound === -1
				? simPlayIns(bracket, info)
				: bracket.series[bracket.currentRound]!,
		round: Math.max(bracket.currentRound, 0),
	};
};

// Returns the tid of the champion
const simBracket = async (
	startingMatchups: Matchup[],
	startingRound: number,
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

	while (true) {
		const neutral = isNeutral(matchups.length);
		const numGamesToWin = helpers.numGamesToWinRound(round, season);
		const numGames = numGamesPlayoffSeries[round]!;

		const winners = matchups.map(({ home, away }) => {
			if (!away || home.won >= numGamesToWin) {
				return home;
			}
			if (away.won >= numGamesToWin) {
				return away;
			}

			const prob = getSeriesProb({
				awayWon: away.won,
				homeWon: home.won,
				numGames,
				numGamesToWin,
				probHomeWinsAtAway: 1 - getGameProb(away.tid, home.tid, neutral),
				probHomeWinsAtHome: getGameProb(home.tid, away.tid, neutral),
			});
			return random() < prob ? home : away;
		});

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
	numSims = DEFAULT_NUM_SIMS,
	playoffSeries,
	season,
	teams,
}: {
	numSims?: number;
	playoffSeries?: Bracket;
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

	const random = makeSeededRandom(1);
	const avgOvr =
		teams.reduce((sum, t) => sum + t.ovr, 0) / Math.max(teams.length, 1);

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

	const playoffsCounts = new Map<number, number>();
	const titleCounts = new Map<number, number>();
	let numTitlesCounted = 0;

	for (let sim = 0; sim < numSims; sim++) {
		const strengths = new Map<number, number>();
		for (const t of teams) {
			strengths.set(
				t.teamSeason.tid,
				t.ovr + realGauss(0, STRENGTH_STD, random),
			);
		}

		const getGameProb = (home: number, away: number, neutral: boolean) => {
			return getWinProbability(
				getGamePrediction({
					...gameInfo,
					neutral,
					ovrs: [strengths.get(home) ?? avgOvr, strengths.get(away) ?? avgOvr],
				}),
			);
		};

		const info = {
			byConf,
			getGameProb,
			numGamesPlayoffSeries,
			random,
			recordScores,
			season,
		};

		let bracket = playoffSeries;
		if (!bracket) {
			const simTeams = teams.map((t) => {
				const { teamSeason } = t;

				// The schedule is not known here, so play an average team with home and away canceling out
				const winp =
					t.clinchedPlayoffs === "o"
						? 0
						: getGameProb(teamSeason.tid, -1, true);

				// Luck in the remaining games, on top of the uncertainty in strength. Normal approximation of a binomial distribution, since only the total matters.
				const won = helpers.bound(
					realGauss(
						t.gamesLeft * winp,
						Math.sqrt(t.gamesLeft * winp * (1 - winp)),
						random,
					),
					0,
					t.gamesLeft,
				);
				const simTeam = getHypotheticalTeam({
					teamSeason,
					won,
					lost: t.gamesLeft - won,
					usePts,
				});

				const { pts, winp: recordWinp } = simTeam.seasonAttrs;
				recordScores.set(teamSeason.tid, usePts ? pts : recordWinp);

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

		const { matchups, round } = getStartingMatchups(bracket, info);
		for (const tid of getFirstRoundTids(matchups)) {
			playoffsCounts.set(tid, (playoffsCounts.get(tid) ?? 0) + 1);
		}

		const champ = await simBracket(matchups, round, info);
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

// Returns undefined if title odds can't be computed
export const getTeamOdds = async () => {
	const season = g.get("season");
	const phase = g.get("phase");
	const playoffs = phase === PHASE.PLAYOFFS;

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

	// Same as in updateClinchedPlayoffs, so odds agree with what has been clinched. Before the regular season there is no schedule yet, so every team has a full season left, and the playoffs are about as far away as the number of games.
	const preseason = phase === PHASE.PRESEASON;
	const gamesLeftByTid = await getGamesLeftSchedule();
	const getGamesLeft = (tid: number) =>
		preseason ? g.get("numGames") : (gamesLeftByTid.get(tid) ?? 0);
	const numDaysInFuture = playoffs
		? 0
		: preseason
			? g.get("numGames")
			: await getDaysLeftSchedule();

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

	const teams = teamSeasons
		.filter((teamSeason) => !teamsByTid.get(teamSeason.tid)?.disabled)
		.map((teamSeason) => {
			const { tid } = teamSeason;

			return {
				clinchedPlayoffs: teamSeason.clinchedPlayoffs,
				gamesLeft: getGamesLeft(tid),
				ovr: getTeamStrength(playersByTid.get(tid) ?? [], {
					numDaysInFuture,
					playoffs,
					t: teamsByTid.get(tid) ?? "default",
				}),
				teamSeason,
			};
		});

	return simTeamOdds({ playoffSeries, season, teams });
};
