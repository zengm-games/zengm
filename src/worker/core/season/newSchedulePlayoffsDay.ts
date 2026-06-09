import setSchedule from "./setSchedule.ts";
import { idb } from "../../db/index.ts";
import { g, helpers, local, lock } from "../../util/index.ts";
import type { PlayoffSeriesTeam } from "../../../common/types.ts";
import { season } from "../index.ts";
import { isSport } from "../../../common/sportFunctions.ts";
import { chunk, groupByUnique } from "../../../common/utils.ts";
import { orderTeams } from "../../util/orderTeams.ts";
import {
	betterSeedHome,
	deleteScheduledGamesForCompletedSeries,
	getScheduledGamesForSeries,
	seriesIsNotOver,
} from "./playoffSchedule.ts";

const getTeamsForOrderTeams = async () => {
	return idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			seasonAttrs: [
				"winp",
				"pts",
				"won",
				"lost",
				"otl",
				"tied",
				"did",
				"cid",
				"wonDiv",
				"lostDiv",
				"otlDiv",
				"tiedDiv",
				"wonConf",
				"lostConf",
				"otlConf",
				"tiedConf",
			],
			stats: ["pts", "oppPts", "gp"],
			season: g.get("season"),
			showNoStats: true,
		},
		"noCopyCache",
	);
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
				const getTeam = (i: number, type: "won" | "lost") => {
					const oldTeam =
						(playIn[i]!.home.won > 0 && type === "won") ||
						(playIn[i]!.away.won > 0 && type === "lost")
							? playIn[i]!.home
							: playIn[i]!.away;

					return {
						...helpers.deepCopy(oldTeam),
						pts: undefined,
						won: 0,
					};
				};
				const matchup = {
					home: getTeam(0, "lost"),
					away: getTeam(1, "won"),
				};
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
			await idb.cache.playoffSeries.put(playoffSeries);
		}
	}

	const series = playoffSeries.series;

	if (series.length === 0) {
		return true;
	}

	const rnd = playoffSeries.currentRound;
	const tids: [number, number][] = [];
	const numGamesPlayoffSeries = g.get("numGamesPlayoffSeries", "current")[rnd]!;
	const numGamesToWin = helpers.numGamesToWinSeries(numGamesPlayoffSeries);

	await deleteScheduledGamesForCompletedSeries(playoffSeries);

	const schedule = await idb.cache.schedule.getAll();
	const activeSeries: {
		home: PlayoffSeriesTeam;
		away: PlayoffSeriesTeam;
	}[] = [];
	for (const { away, home } of series[rnd]!) {
		if (seriesIsNotOver(home, away, numGamesToWin)) {
			activeSeries.push({ away, home });
		}
	}

	if (activeSeries.length > 0) {
		for (const { away, home } of activeSeries) {
			if (getScheduledGamesForSeries(schedule, home.tid, away.tid).length > 0) {
				return false;
			}
		}

		for (let gameNum = 0; gameNum < numGamesPlayoffSeries; gameNum++) {
			for (const { away, home } of activeSeries) {
				// Make sure to set home/away teams correctly! Home for the lower seed is 1st, 2nd, 5th, and 7th games.
				if (betterSeedHome(numGamesPlayoffSeries, gameNum)) {
					tids.push([home.tid, away.tid]);
				} else {
					tids.push([away.tid, home.tid]);
				}
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
			const allStar = await idb.getCopy.allStars({ season: g.get("season") });
			if (!allStar?.score) {
				tids.unshift([-1, -2]);
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
		await lock.set("stopGameSim", true);
		local.playingUntilEndOfRound = false;
	}

	// Set matchups for next round

	// Which teams won?
	let teamsWon: PlayoffSeriesTeam[] = [];
	for (const { home, away } of series[rnd]!) {
		let teamWon;
		if (home.won >= numGamesToWin || !away) {
			teamWon = helpers.deepCopy(home);
		} else {
			teamWon = helpers.deepCopy(away);
		}
		teamsWon.push(teamWon);

		// In hockey, if team won by more than 1 game, goalie fatigue resets
		if (isSport("hockey")) {
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

	let teamsForOrderTeams; // cache

	// Need to reorder for reseeding?
	if (g.get("playoffsReseed")) {
		let groups: PlayoffSeriesTeam[][];

		// teamsWon.length > playoffsByConf check is so it stops grouping by conference when all the intraconference matchups are complete
		if (playoffsByConf !== false && teamsWon.length > playoffsByConf) {
			const groupSize = Math.ceil(teamsWon.length / playoffsByConf);
			groups = chunk(teamsWon, groupSize);
		} else {
			groups = [[...teamsWon]];
		}

		if (!teamsForOrderTeams) {
			teamsForOrderTeams = await getTeamsForOrderTeams();
		}

		// Sort the groups so that each 2 teams are a matchup (best team, worst team, 2nd best team, 2nd worst team, etc)
		for (const [i, group] of groups.entries()) {
			let orderedGroup;

			// If playoffByConf, we can only reseed based on seed if we're still in the conference bracket, otherwise the seeds are not comparable. This matters if you have 4 conferences, because then it's not just the home/away in the finals that matter, it's the actual matchups too!
			if (playoffsByConf !== false && teamsWon.length <= playoffsByConf) {
				const groupByTid = groupByUnique(group, "tid");
				const orderedTeams = await orderTeams(
					teamsForOrderTeams.filter((t) => !!groupByTid[t.tid]),
					teamsForOrderTeams,
					{
						skipDivisionLeaders: true,
					},
				);
				orderedGroup = orderedTeams.map((t) => groupByTid[t.tid]!);
			} else {
				orderedGroup = group.sort((a, b) => a.seed - b.seed);
			}

			const interleaved: PlayoffSeriesTeam[] = [];
			while (orderedGroup.length > 0) {
				const t =
					interleaved.length % 2 === 0
						? orderedGroup.shift()!
						: orderedGroup.pop()!;
				interleaved.push(t);
			}
			groups[i] = interleaved;
		}

		teamsWon = groups.flat();
	}

	for (let i = 0; i < teamsWon.length; i += 2) {
		const team1 = teamsWon[i]!;
		const team2 = teamsWon[i + 1]!;

		// Set home/away in the next round - seed ties should be impossible except maybe in the finals, which is handled below
		let firstTeamHome = team1.seed < team2.seed;

		// Special case for after the byConf rounds end - go by winp not seed, since the seeds are not directly comparable. This is somewhat redundant if the above orderTeams code ran, but is necessary if reseeding is disabled. Probably this could be refactored so there is only one orderTeams
		if (playoffsByConf !== false && teamsWon.length <= playoffsByConf) {
			if (!teamsForOrderTeams) {
				teamsForOrderTeams = await getTeamsForOrderTeams();
			}
			const matchupTeams = teamsForOrderTeams.filter(
				(t) => t.tid === team1.tid || t.tid === team2.tid,
			);
			if (matchupTeams.length === 2) {
				const orderedTeams = await orderTeams(
					matchupTeams,
					teamsForOrderTeams,
					{
						skipDivisionLeaders: true,
					},
				);
				firstTeamHome = orderedTeams[0]!.tid === team1.tid;
			}
		}

		const matchup = firstTeamHome
			? {
					home: team1,
					away: team2,
				}
			: {
					home: team2,
					away: team1,
				};
		matchup.home.pts = undefined;
		matchup.away.pts = undefined;
		matchup.home.sPts = undefined;
		matchup.away.sPts = undefined;
		matchup.home.won = 0;
		matchup.away.won = 0;
		series[rnd + 1]![i / 2] = matchup;
	}

	// Previously was just `playoffSeries.currentRound += 1` but some people reported that playoffSeries.currentRound was somehow getting too high, resulting in errors in other parts of the code. Not sure how that happened, but maybe this fixes it? I don't see anywhere else where playoffSeries.currentRound is updated.
	// This works because any rounds that are not yet current will have no matchups in them
	playoffSeries.currentRound =
		playoffSeries.series.filter((row) => row.length > 0).length - 1;
	await idb.cache.playoffSeries.put(playoffSeries);

	// Update hype for winning a series
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

		await idb.cache.teamSeasons.put(teamSeason);
	}

	// Next time, the schedule for the first day of the next round will be set
	return newSchedulePlayoffsDay();
};

export default newSchedulePlayoffsDay;
