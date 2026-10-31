import { PHASE } from "../../../common/constants.ts";
import { makeSeededRandom, realGauss } from "../../../common/random.ts";
import { bySport } from "../../../common/sportFunctions.ts";
import type {
	PlayoffSeries,
	PlayoffSeriesTeam,
} from "../../../common/types.ts";
import { chunk } from "../../../common/utils.ts";
import {
	getWinModelInputs,
	getWinProbability,
} from "../../../common/winProbability.ts";
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
import getPlayoffsByConf from "../season/getPlayoffsByConf.ts";
import { betterSeedHome } from "../season/newSchedulePlayoffsDay.ts";
import {
	getHypotheticalTeam,
	type TeamSeasonRecord,
} from "./getHypotheticalTeam.ts";
import ovr from "./ovr.ts";

const DEFAULT_NUM_SIMS = 1000;

// How far a team's true strength can be from its ovr, in ovr points. Measured from how far season MOV is from what preseason ovr predicts, after taking out single game noise. One value is drawn per team per sim and used for all of its games, otherwise the best team wins too often, since it never has a bad season or a bad playoff run.
const STRENGTH_STD = bySport({
	baseball: 5.5,
	basketball: 8,
	football: 8,
	hockey: 11,
});

type TitleOddsTeam = {
	// Mathematically out of the playoffs
	eliminated: boolean;

	gamesLeft: number;
	ovr: number;
	teamSeason: TeamSeasonRecord;
};

// resolved means prob comes from the state of the game, not from a simulation
export type TitleOdds = Record<number, { prob: number; resolved?: boolean }>;

type BracketTeam = Pick<
	PlayoffSeriesTeam,
	"pendingPlayIn" | "seed" | "tid" | "won"
>;

type Matchup = { home: BracketTeam; away?: BracketTeam };

type Bracket = Pick<PlayoffSeries, "currentRound" | "playIns"> & {
	series: Matchup[][];
};

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

// Same order as the home team is decided in newSchedulePlayoffsDay
const getNextMatchups = (winners: BracketTeam[], info: SimInfo) => {
	const { byConf, recordScores } = info;

	const getRecordScore = (t: BracketTeam) => recordScores.get(t.tid) ?? 0;

	// After the conference rounds, seeds from different conferences are not comparable
	const crossConf = byConf !== false && winners.length <= byConf;

	let teams = winners;
	if (g.get("playoffsReseed")) {
		const groups =
			byConf !== false && winners.length > byConf
				? chunk(winners, Math.ceil(winners.length / byConf))
				: [winners];

		teams = groups.flatMap((group) => {
			const ordered = group.toSorted((a, b) =>
				crossConf ? getRecordScore(b) - getRecordScore(a) : a.seed - b.seed,
			);

			const interleaved: BracketTeam[] = [];
			while (ordered.length > 0) {
				interleaved.push(
					interleaved.length % 2 === 0 ? ordered.shift()! : ordered.pop()!,
				);
			}
			return interleaved;
		});
	}

	return chunk(teams, 2).map(([team1, team2]) => {
		const firstTeamHome = crossConf
			? getRecordScore(team1!) >= getRecordScore(team2!)
			: team1!.seed < team2!.seed;
		const [home, away] = firstTeamHome ? [team1!, team2!] : [team2!, team1!];
		return { home: { ...home, won: 0 }, away: { ...away, won: 0 } };
	});
};

const simPlayIns = (bracket: Bracket, info: SimInfo): Matchup[] => {
	const neutral = g.get("neutralSite") === "playoffs";

	// Winners and losers in that order
	const playGame = ({
		home,
		away,
	}: {
		home: BracketTeam;
		away: BracketTeam;
	}) => {
		if (home.won > 0) {
			return [home, away] as const;
		}
		if (away.won > 0) {
			return [away, home] as const;
		}
		return info.random() < info.getGameProb(home.tid, away.tid, neutral)
			? ([home, away] as const)
			: ([away, home] as const);
	};

	const winnersBySlot = new Map<number, BracketTeam>();
	for (const playIn of bracket.playIns ?? []) {
		const [game0, game1, game2] = playIn;
		const [winner0, loser0] = playGame(game0);
		const [winner1] = playGame(game1);
		const [winner2] = playGame(game2 ?? { home: loser0, away: winner1 });

		// Same as in updatePlayoffSeries, these are the placeholder tids in the first round of the playoffs
		winnersBySlot.set(game0.home.tid, winner0);
		winnersBySlot.set(game0.away.tid, winner2);
	}

	const fillSlot = (t: BracketTeam) => {
		const winner = t.pendingPlayIn ? winnersBySlot.get(t.tid) : undefined;
		return winner ? { ...winner, seed: t.seed, won: 0 } : t;
	};

	return bracket.series[0]!.map(({ home, away }) => ({
		home: fillSlot(home),
		away: away ? fillSlot(away) : undefined,
	}));
};

// Returns the tid of the champion. This only reads bracket, so the same one can be used for every sim.
const simBracket = (bracket: Bracket, info: SimInfo) => {
	const { getGameProb, numGamesPlayoffSeries, random, season } = info;

	let round = Math.max(bracket.currentRound, 0);
	let matchups =
		bracket.currentRound === -1
			? simPlayIns(bracket, info)
			: bracket.series[round]!;

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

		matchups = getNextMatchups(winners, info);
		round += 1;
	}
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

		const getLoser = (game?: { home: BracketTeam; away: BracketTeam }) => {
			if (game) {
				return game.home.won > 0
					? game.away
					: game.away.won > 0
						? game.home
						: undefined;
			}
		};
		for (const playIn of bracket.playIns ?? []) {
			for (const { home, away } of playIn) {
				alive.add(home.tid);
				alive.add(away.tid);
			}
			for (const game of [playIn[1], playIn[2]]) {
				const loser = getLoser(game);
				if (loser) {
					alive.delete(loser.tid);
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
export const simTitleOdds = async ({
	numSims = DEFAULT_NUM_SIMS,
	playoffSeries,
	season,
	teams,
}: {
	numSims?: number;
	playoffSeries?: Bracket;
	season: number;
	teams: TitleOddsTeam[];
}): Promise<TitleOdds | undefined> => {
	const odds: TitleOdds = {};

	const champion = playoffSeries
		? getChampion(playoffSeries, season)
		: undefined;
	if (champion !== undefined) {
		for (const { teamSeason } of teams) {
			odds[teamSeason.tid] = {
				prob: teamSeason.tid === champion ? 1 : 0,
				resolved: true,
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
		: new Set(teams.filter((t) => !t.eliminated).map((t) => t.teamSeason.tid));

	const random = makeSeededRandom(1);
	const avgOvr =
		teams.reduce((sum, t) => sum + t.ovr, 0) / Math.max(teams.length, 1);

	const recordScores = new Map<number, number>();
	for (const { teamSeason } of teams) {
		recordScores.set(
			teamSeason.tid,
			helpers.calcWinp({
				lost: teamSeason.lost ?? 0,
				otl: teamSeason.otl ?? 0,
				tied: teamSeason.tied ?? 0,
				won: teamSeason.won ?? 0,
			}),
		);
	}

	const counts = new Map<number, number>();
	let numCounted = 0;

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
				getWinModelInputs({
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
				const winp = t.eliminated ? 0 : getGameProb(teamSeason.tid, -1, true);
				const won = t.gamesLeft * winp;
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
			bracket = {
				currentRound: generated.playIns ? -1 : 0,
				playIns: generated.playIns,
				series: generated.series,
			};
		}

		const champ = simBracket(bracket, info);
		if (champ !== undefined && aliveTids.has(champ)) {
			counts.set(champ, (counts.get(champ) ?? 0) + 1);
			numCounted += 1;
		}
	}

	for (const { teamSeason } of teams) {
		const { tid } = teamSeason;
		odds[tid] = aliveTids.has(tid)
			? { prob: (counts.get(tid) ?? 0) / Math.max(numCounted, 1) }
			: { prob: 0, resolved: true };
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
export const isTitleOddsAvailable = (season: number) => {
	return (
		season === g.get("season") &&
		g.get("phase") >= PHASE.PRESEASON &&
		g.get("numGamesPlayoffSeries", season).length > 0
	);
};

// Returns undefined if title odds can't be computed
export const getTitleOdds = async () => {
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

	// Before the regular season, there may be no schedule yet, so assume that the playoffs are about as far away as the number of games
	const numDaysInFuture = playoffs
		? 0
		: (await getDaysLeftSchedule()) || g.get("numGames");

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
			const gp =
				teamSeason.won + teamSeason.lost + teamSeason.tied + teamSeason.otl;

			return {
				eliminated: teamSeason.clinchedPlayoffs === "o",
				gamesLeft: Math.max(g.get("numGames") - gp, 0),
				ovr: getTeamStrength(playersByTid.get(tid) ?? [], {
					numDaysInFuture,
					playoffs,
					t: teamsByTid.get(tid) ?? "default",
				}),
				teamSeason,
			};
		});

	return simTitleOdds({ playoffSeries, season, teams });
};
