import setSchedule from "./setSchedule";
import { idb } from "../../db";
import { g, helpers, local, lock, orderTeams } from "../../util";
import type { PlayoffSeriesTeam } from "../../../common/types";
import { season } from "..";

// Play 2 home (true) then 2 away (false) and repeat, but ensure that the better team always gets the last game.
const betterSeedHome = (numGamesPlayoffSeries: number, gameNum: number) => {
	// For series lengths like 3, 7, 11, 15, etc., special case last 3 games to ensure the home team always gets the last game
	const needsSpecialEnding = (numGamesPlayoffSeries + 1) % 4 === 0;

	if (needsSpecialEnding) {
		// Special case for last 3 games
		if (gameNum >= numGamesPlayoffSeries - 3) {
			return (
				gameNum === numGamesPlayoffSeries - 3 ||
				gameNum === numGamesPlayoffSeries - 1
			);
		}
	}

	const num = Math.floor(gameNum / 2);
	return num % 2 === 0;
};

const seriesIsNotOver = (
	home: PlayoffSeriesTeam,
	away: PlayoffSeriesTeam | undefined,
	numGamesToWin: number,
): away is PlayoffSeriesTeam =>
	!!(away && home.won < numGamesToWin && away.won < numGamesToWin);

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
						(playIn[i].home.won > 0 && type === "won") ||
						(playIn[i].away.won > 0 && type === "lost")
							? playIn[i].home
							: playIn[i].away;

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
			playoffSeries.currentRound += 1;
		}
	}

	const series = playoffSeries.series;

	if (series.length === 0) {
		return true;
	}

	const rnd = playoffSeries.currentRound;
	const tids: [number, number][] = [];
	const numGamesToWin = helpers.numGamesToWinSeries(
		g.get("numGamesPlayoffSeries", "current")[rnd],
	);

	let minGamesPlayedThisRound = Infinity;
	for (const { away, home } of series[rnd]) {
		if (seriesIsNotOver(home, away, numGamesToWin)) {
			const numGames = home.won + away.won;
			if (numGames < minGamesPlayedThisRound) {
				minGamesPlayedThisRound = numGames;
			}
		}
	}

	// Try to schedule games if there are active series
	for (const { away, home } of series[rnd]) {
		if (seriesIsNotOver(home, away, numGamesToWin)) {
			const numGames = home.won + away.won;

			// Because live game sim is an individual game now, not a whole day, need to check if some series are ahead of others and therefore should not get a game today.
			if (numGames > minGamesPlayedThisRound) {
				continue;
			}

			// Make sure to set home/away teams correctly! Home for the lower seed is 1st, 2nd, 5th, and 7th games.
			if (
				betterSeedHome(g.get("numGamesPlayoffSeries", "current")[rnd], numGames)
			) {
				tids.push([home.tid, away.tid]);
			} else {
				tids.push([away.tid, home.tid]);
			}
		}
	}

	// If series are still in progress, write games and short circuit
	if (tids.length > 0) {
		await setSchedule(tids);
		return false;
	}

	// If playoffs are over, update winner and go to next phase
	if (rnd === g.get("numGamesPlayoffSeries", "current").length - 1) {
		const { away, home } = series[rnd][0];
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
	for (const { home, away } of series[rnd]) {
		if (home.won >= numGamesToWin || !away) {
			teamsWon.push(helpers.deepCopy(home));
		} else {
			teamsWon.push(helpers.deepCopy(away));
		}
	}

	// Need to reorder for reseeding?
	if (g.get("playoffsReseed")) {
		// Can't just look in playoffSeries.byConf because of upgraded leagues and real players leagues started in the playoffs
		const playoffsByConf = await season.getPlayoffsByConf(g.get("season"));

		let groups: PlayoffSeriesTeam[][];
		if (playoffsByConf) {
			const half = Math.ceil(teamsWon.length / 2);
			groups = [teamsWon.slice(0, half), teamsWon.slice(-half)];
		} else {
			groups = [[...teamsWon]];
		}

		// Sort the groups so that each 2 teams are a matchup (best team, worst team, 2nd best team, 2nd worst team, etc)
		for (let i = 0; i < groups.length; i++) {
			const group = groups[i];
			group.sort((a, b) => a.seed - b.seed);

			const interleaved: PlayoffSeriesTeam[] = [];
			while (group.length > 0) {
				if (interleaved.length % 2 === 0) {
					interleaved.push(group.shift() as PlayoffSeriesTeam);
				} else {
					interleaved.push(group.pop() as PlayoffSeriesTeam);
				}
			}
			groups[i] = interleaved;
		}

		teamsWon = groups.flat();
	}

	const playoffsByConf = await season.getPlayoffsByConf(g.get("season"));

	for (let i = 0; i < teamsWon.length; i += 2) {
		const team1 = teamsWon[i];
		const team2 = teamsWon[i + 1];

		// Set home/away in the next round - seed ties should be impossible except maybe in the finals, which is handled below
		let firstTeamHome = team1.seed < team2.seed;

		// Special case for the finals, do it by winp not seed
		if (playoffsByConf) {
			const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;

			// Plus 2 reason: 1 is for 0 indexing, 1 is because currentRound hasn't been incremented yet
			if (numPlayoffRounds === playoffSeries.currentRound + 2) {
				const allTeams = await idb.getCopies.teamsPlus(
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
				const finalsTeams = allTeams.filter(
					t => t.tid === team1.tid || t.tid === team2.tid,
				);
				if (finalsTeams.length === 2) {
					const orderedTeams = await orderTeams(finalsTeams, allTeams, {
						skipDivisionLeaders: true,
					});
					firstTeamHome = orderedTeams[0].tid === team1.tid;
				}
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
		matchup.home.won = 0;
		matchup.away.won = 0;
		series[rnd + 1][i / 2] = matchup;
	}

	playoffSeries.currentRound += 1;
	await idb.cache.playoffSeries.put(playoffSeries);

	// Update hype for winning a series
	await Promise.all(
		teamsWon.map(async ({ tid }) => {
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
		}),
	);

	// Next time, the schedule for the first day of the next round will be set
	return newSchedulePlayoffsDay();
};

export default newSchedulePlayoffsDay;
