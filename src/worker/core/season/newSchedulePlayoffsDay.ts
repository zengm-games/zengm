import setSchedule from "./setSchedule.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, local, sim } from "../../util/index.ts";
import type { PlayoffSeriesTeam } from "../../../common/types.ts";
import { season, team } from "../index.ts";
import { groupByUnique } from "../../../common/utils.ts";
import {
	ORDER_TEAMS_SEASON_ATTRS,
	ORDER_TEAMS_STATS,
	orderTeams,
} from "../../util/orderTeams.ts";
import { ALL_STAR_GAME_TIDS } from "../../../common/specialGames.ts";
import {
	betterSeedHome,
	getNextRoundMatchups,
	getPlayInFinalGame,
} from "./playoffBracket.ts";

const seriesIsNotOver = (
	home: PlayoffSeriesTeam,
	away: PlayoffSeriesTeam | undefined,
	numGamesToWin: number,
): away is PlayoffSeriesTeam =>
	!!(away && home.won < numGamesToWin && away.won < numGamesToWin);

const getTeamsForOrderTeams = () => {
	return team.getFormattedAll({
		attrs: ["tid"],
		seasonAttrs: ORDER_TEAMS_SEASON_ATTRS,
		stats: ORDER_TEAMS_STATS,
		season: g.get("season"),
		showNoStats: true,
	});
};

/**
 * Create a single day's schedule for an in-progress playoffs.
 *
 * @memberOf core.season
 * @return {Promise.boolean} Resolves to true if the playoffs are over. Otherwise, false.
 */
const newSchedulePlayoffsDay = async (): Promise<boolean> => {
	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	if (!playoffSeries) {
		throw new Error("No playoff series");
	}

	const playIns = playoffSeries.playIns;
	if (playoffSeries.currentRound === -1 && playIns && playIns.length > 0) {
		const tids: [number, number][] = [];

		// Is play-in tournament still going on?
		for (const playIn of playIns) {
			// If length is 3, that means the final game in the play-in was already scheduled, so no need to do any more
			const needsSecondRound =
				playIn.length === 2 &&
				playIn[0].home.won + playIn[0].away.won === 1 &&
				playIn[1].home.won + playIn[1].away.won === 1;
			if (needsSecondRound) {
				const matchup = getPlayInFinalGame(playIn);
				playIn.push(matchup);

				tids.push([matchup.home.tid, matchup.away.tid]);
			} else {
				for (const matchup of playIn) {
					if (matchup.home.won === 0 && matchup.away.won === 0) {
						tids.push([matchup.home.tid, matchup.away.tid]);
					}
				}
			}
		}

		if (tids.length > 0) {
			await idb.cache.playoffSeries.put(playoffSeries);
			await setSchedule(tids);
			return false;
		} else {
			// playIn is over, so proceed to next round
			playoffSeries.currentRound = 0;
		}
	}

	const series = playoffSeries.series;

	if (series.length === 0) {
		return true;
	}

	const rnd = playoffSeries.currentRound;
	const tids: [number, number][] = [];
	const numGamesToWin = helpers.numGamesToWinRound(rnd);

	let minGamesPlayedThisRound = Infinity;
	for (const { away, home } of series[rnd]!) {
		if (seriesIsNotOver(home, away, numGamesToWin)) {
			const numGames = home.won + away.won;
			if (numGames < minGamesPlayedThisRound) {
				minGamesPlayedThisRound = numGames;
			}
		}
	}

	// Try to schedule games if there are active series
	for (const { away, home } of series[rnd]!) {
		if (seriesIsNotOver(home, away, numGamesToWin)) {
			const numGames = home.won + away.won;

			// Because live game sim is an individual game now, not a whole day, need to check if some series are ahead of others and therefore should not get a game today.
			if (numGames > minGamesPlayedThisRound) {
				continue;
			}

			// Make sure to set home/away teams correctly! Home for the lower seed is 1st, 2nd, 5th, and 7th games.
			if (
				betterSeedHome(
					g.get("numGamesPlayoffSeries", "current")[rnd]!,
					numGames,
				)
			) {
				tids.push([home.tid, away.tid]);
			} else {
				tids.push([away.tid, home.tid]);
			}
		}
	}

	// If series are still in progress, write games and short circuit
	if (tids.length > 0) {
		// Check if we need a playoffs All-Star Game
		if (
			g.get("allStarGame") === -1 &&
			series[rnd]!.length === 1 &&
			series[rnd]![0]!.home.won === 0 &&
			series[rnd]![0]!.away?.won === 0
		) {
			// Make sure we didn't just play the All-Star Game - only schedule once
			const allStar = await idb.merged.allStars.get(g.get("season"));
			if (!allStar?.score) {
				tids.unshift([...ALL_STAR_GAME_TIDS]);
			}
		}

		await setSchedule(tids);
		return false;
	}

	// If playoffs are over, update winner and go to next phase
	if (rnd === g.get("numGamesPlayoffSeries", "current").length - 1) {
		const { away, home } = series[rnd]![0]!;
		let key;

		if (home.won >= numGamesToWin || !away) {
			key = home.tid;
		} else {
			key = away.tid;
		}

		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsBySeasonTid",
			[g.get("season"), key],
		);
		if (!teamSeason) {
			throw new Error("No team season");
		}
		teamSeason.playoffRoundsWon = g.get(
			"numGamesPlayoffSeries",
			"current",
		).length;
		teamSeason.hype += 0.05;

		if (teamSeason.hype > 1) {
			teamSeason.hype = 1;
		}

		await idb.cache.teamSeasons.put(teamSeason);

		// Playoffs are over! Return true!
		return true;
	}

	// Playoffs are not over! Make another round
	// Handle "Play until end of round"
	if (local.playingUntilEndOfRound) {
		sim.requestStop();
		local.playingUntilEndOfRound = false;
	}

	// Set matchups for next round

	// Which teams won?
	const teamsWon: PlayoffSeriesTeam[] = [];
	for (const { home, away } of series[rnd]!) {
		let teamWon;
		if (home.won >= numGamesToWin || !away) {
			teamWon = helpers.deepCopy(home);
		} else {
			teamWon = helpers.deepCopy(away);
		}
		teamsWon.push(teamWon);

		// In hockey, if team won by more than 1 game, goalie fatigue resets
		if (__SPORT === "hockey") {
			if (!away || Math.abs(home.won - away.won) > 1) {
				const players = await idb.cache.players.indexGetAll(
					"playersByTid",
					teamWon.tid,
				);
				for (const p of players) {
					if (
						p.numConsecutiveGamesG !== undefined &&
						p.numConsecutiveGamesG !== 0
					) {
						p.numConsecutiveGamesG = 0;
						await idb.cache.players.put(p);
					}
				}
			}
		}
	}

	// Can't just look in playoffSeries.byConf because of upgraded leagues and real players leagues started in the playoffs
	const playoffsByConf = await season.getPlayoffsByConf(g.get("season"));

	let teamsForOrderTeams: Awaited<ReturnType<typeof getTeamsForOrderTeams>>;
	const orderAcrossConfs = async (teams: PlayoffSeriesTeam[]) => {
		teamsForOrderTeams ??= await getTeamsForOrderTeams();
		const tids = new Set(teams.map((t) => t.tid));
		const orderedTeams = await orderTeams(
			teamsForOrderTeams.filter((t) => tids.has(t.tid)),
			teamsForOrderTeams,
			{
				skipDivisionLeaders: true,
			},
		);

		// Should never happen, but just in case a team is missing, seeds are better than nothing
		if (orderedTeams.length !== teams.length) {
			return teams.toSorted((a, b) => a.seed - b.seed);
		}

		const teamsByTid = groupByUnique(teams, "tid");
		return orderedTeams.map((t) => teamsByTid[t.tid]!);
	};

	const matchups = await getNextRoundMatchups({
		orderAcrossConfs,
		playoffsByConf,
		reseed: g.get("playoffsReseed"),
		teamsWon,
	});
	for (const [i, matchup] of matchups.entries()) {
		matchup.home.pts = undefined;
		matchup.away.pts = undefined;
		matchup.home.sPts = undefined;
		matchup.away.sPts = undefined;
		matchup.home.won = 0;
		matchup.away.won = 0;
		series[rnd + 1]![i] = matchup;
	}

	// Previously was just `playoffSeries.currentRound += 1` but some people reported that playoffSeries.currentRound was somehow getting too high, resulting in errors in other parts of the code. Not sure how that happened, but maybe this fixes it? I don't see anywhere else where playoffSeries.currentRound is updated.
	// This works because any rounds that are not yet current will have no matchups in them
	playoffSeries.currentRound =
		playoffSeries.series.filter((row) => row.length > 0).length - 1;
	await idb.cache.playoffSeries.put(playoffSeries);

	// Update hype for winning a series
	const teamSeasonsToSave = [];
	for (const { tid } of teamsWon) {
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsBySeasonTid",
			[g.get("season"), tid],
		);
		if (!teamSeason) {
			throw new Error("No team season");
		}
		teamSeason.playoffRoundsWon = playoffSeries.currentRound;
		teamSeason.hype += 0.05;

		if (teamSeason.hype > 1) {
			teamSeason.hype = 1;
		}

		teamSeasonsToSave.push(teamSeason);
	}
	await idb.cache.teamSeasons.putAll(teamSeasonsToSave);

	// Next time, the schedule for the first day of the next round will be set
	return newSchedulePlayoffsDay();
};

export default newSchedulePlayoffsDay;
