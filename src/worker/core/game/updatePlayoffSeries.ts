import { idb } from "../../db/index.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import type { Conditions, GameResults } from "../../../common/types.ts";
import season from "../season/index.ts";
import { findSeries } from "./writeGameStats.ts";
import getWinner from "../../../common/getWinner.ts";
import formatScoreWithShootout from "../../../common/formatScoreWithShootout.ts";

const updatePlayoffSeries = async (
	results: GameResults,
	conditions: Conditions,
) => {
	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	if (!playoffSeries) {
		throw new Error("playoffSeries not found");
	}

	const numGamesToWinSeries =
		playoffSeries.currentRound === -1
			? 1
			: helpers.numGamesToWinSeries(
					g.get("numGamesPlayoffSeries", "current")[playoffSeries.currentRound],
				);

	for (const result of results) {
		// Did the home (0) or away (1) team win this game? Here, "home" refers to this game, not the team which has homecourt advantage in the playoffs, which is what series.home refers to below.
		const winner = getWinner([result.team[0].stat, result.team[1].stat]);
		const series = findSeries(
			playoffSeries,
			result.team[0].id,
			result.team[1].id,
		);
		if (series && series.away) {
			const { away, home } = series;

			if (home.pts === undefined) {
				home.pts = 0;
			}
			if (away.pts === undefined) {
				away.pts = 0;
			}

			const shootout = result.team[0].stat.sPts !== undefined;
			if (shootout) {
				if (home.sPts === undefined) {
					home.sPts = 0;
				}
				if (away.sPts === undefined) {
					away.sPts = 0;
				}
			}

			if (home.tid === result.team[0].id) {
				home.pts += result.team[0].stat.pts;
				away.pts += result.team[1].stat.pts;
				if (shootout) {
					home.sPts += result.team[0].stat.sPts;
					away.sPts += result.team[1].stat.sPts;
				}

				if (winner === 0) {
					home.won += 1;
				} else {
					away.won += 1;
				}
			} else if (away.tid === result.team[0].id) {
				away.pts += result.team[0].stat.pts;
				home.pts += result.team[1].stat.pts;
				if (shootout) {
					away.sPts += result.team[0].stat.sPts;
					home.sPts += result.team[1].stat.sPts;
				}

				if (winner === 0) {
					away.won += 1;
				} else {
					home.won += 1;
				}
			}

			if (series.gids === undefined) {
				series.gids = [];
			}
			series.gids.push(result.gid);
		} else {
			continue;
		}

		// Log result of playoff series
		if (
			series.away.won >= numGamesToWinSeries ||
			series.home.won >= numGamesToWinSeries
		) {
			let winnerPts;
			let winnerSPts;
			let winnerTid;
			let loserPts;
			let loserSPts;
			let loserTid;
			let loserWon;

			if (series.away.won >= numGamesToWinSeries) {
				winnerPts = series.away.pts;
				winnerSPts = series.away.sPts;
				winnerTid = series.away.tid;
				loserPts = series.home.pts;
				loserSPts = series.home.sPts;
				loserTid = series.home.tid;
				loserWon = series.home.won;
			} else {
				winnerPts = series.home.pts;
				winnerSPts = series.away.sPts;
				winnerTid = series.home.tid;
				loserPts = series.away.pts;
				loserSPts = series.home.sPts;
				loserTid = series.away.tid;
				loserWon = series.away.won;
			}

			const playoffsByConf = await season.getPlayoffsByConf(g.get("season"));
			const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;
			const currentRoundText = helpers.playoffRoundName({
				currentRound: playoffSeries.currentRound,
				numPlayoffRounds,
				playoffsByConf,
				season: playoffSeries.season,
			}).name;

			// Not needed, because individual game event in writeGameStats will cover this round
			const saveToDb =
				playoffSeries.currentRound >= 0 &&
				playoffSeries.currentRound >= numPlayoffRounds - 2;

			const showPts =
				winnerPts !== undefined &&
				loserPts !== undefined &&
				numGamesToWinSeries === 1;
			const score = showPts
				? formatScoreWithShootout(
						{
							pts: winnerPts!,
							sPts: winnerSPts,
						},
						{
							pts: loserPts!,
							sPts: loserSPts,
						},
					)
				: `${numGamesToWinSeries}-${loserWon}`;
			const showNotification =
				series.away.tid === g.get("userTid") ||
				series.home.tid === g.get("userTid") ||
				playoffSeries.currentRound ===
					g.get("numGamesPlayoffSeries", "current").length - 1;
			logEvent(
				{
					type: "playoffs",
					text: `The <a href="${helpers.leagueUrl([
						"roster",
						`${g.get("teamInfoCache")[winnerTid]?.abbrev}_${winnerTid}`,
						g.get("season"),
					])}">${
						g.get("teamInfoCache")[winnerTid]?.name
					}</a> defeated the <a href="${helpers.leagueUrl([
						"roster",
						`${g.get("teamInfoCache")[loserTid]?.abbrev}_${loserTid}`,
						g.get("season"),
					])}">${
						g.get("teamInfoCache")[loserTid]?.name
					}</a> in the ${currentRoundText}, ${score}.`,
					showNotification,
					tids: [winnerTid, loserTid],
					score: 10,
					saveToDb,
				},
				conditions,
			);

			if (playoffSeries.currentRound === -1 && playoffSeries.playIns) {
				let playInsIndex;
				let playInIndex;
				for (const [i, playIn] of playoffSeries.playIns.entries()) {
					for (const [j, matchup] of playIn.entries()) {
						if (matchup === series) {
							playInsIndex = i;
							playInIndex = j;
							break;
						}
					}
				}

				if (playInIndex === undefined || playInsIndex === undefined) {
					throw new Error("Play-in matchup not found");
				}

				// If this is the first game (top 2 teams) or last game (2nd round) of a play-in tournament, move the winner to the appropriate spot in the playoffs
				let targetTid; // Team to replace in initial playoff matchups
				if (playInIndex === 0) {
					targetTid = playoffSeries.playIns[playInsIndex]![0].home.tid;
				} else if (playInIndex === 2) {
					targetTid = playoffSeries.playIns[playInsIndex]![0].away.tid;
				}
				if (targetTid !== undefined) {
					const winner =
						series.away.tid === winnerTid ? series.away : series.home;

					// Find target team in playoffSeries and replace with winner of this game
					for (const matchup of playoffSeries.series[0]!) {
						for (const type of ["home", "away"] as const) {
							const matchupTeam = matchup[type];
							if (
								matchupTeam &&
								matchupTeam.pendingPlayIn &&
								matchupTeam.tid === targetTid
							) {
								matchup[type] = {
									...winner,
									seed: matchupTeam.seed,
									won: 0,
									pts: undefined,
									pendingPlayIn: undefined,
								};
							}
						}
					}

					// Update playoffRoundsWon, since now team has actually made the playoffs
					const teamSeason = await idb.cache.teamSeasons.indexGet(
						"teamSeasonsBySeasonTid",
						[g.get("season"), winnerTid],
					);
					if (teamSeason) {
						teamSeason.playoffRoundsWon = 0;
						await idb.cache.teamSeasons.put(teamSeason);
					}
				}
			}
		}
	}

	await idb.cache.playoffSeries.put(playoffSeries);
};

export default updatePlayoffSeries;
