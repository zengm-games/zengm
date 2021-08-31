import { idb } from "../../db";
import type { TeamSeason, Conditions, TeamStats } from "../../../common/types";
import { g, helpers, logEvent } from "../../util";
import { genPlayoffSeriesFromTeams } from "../season/genPlayoffSeries";
import evaluatePointsFormula from "./evaluatePointsFormula";
import { season } from "..";

type ClinchedPlayoffs = TeamSeason["clinchedPlayoffs"];

const getClinchedPlayoffs = async (
	teamSeasons: TeamSeason[],
	teamStats: Map<number, TeamStats>,
	finalStandings: boolean,
) => {
	if (g.get("numGamesPlayoffSeries").length === 0) {
		return teamSeasons.map(() => undefined);
	}

	const usePts = g.get("pointsFormula", "current") !== "";

	// We can skip tiebreakers because we add an extra 0.1 to the best/worst case win totals. Without skipping tiebreakers, it's way too slow.
	const skipTiebreakers = !finalStandings;

	const output: ClinchedPlayoffs[] = [];
	for (const t of teamSeasons) {
		const worstCases = teamSeasons.map(t2 => {
			const tied = t2.tied ?? 0;
			const otl = t2.otl ?? 0;
			const gp = t2.won + t2.lost + tied + otl;

			// finalStandings means the season is over, which matters because in some league structures not all teams will play the same number of games
			const gamesLeft = finalStandings ? 0 : g.get("numGames") - gp;

			const stats = teamStats.get(t2.tid);

			const worstCase = {
				tid: t2.tid,
				seasonAttrs: {
					won: t2.won,
					lost: t2.lost,
					otl,
					tied,
					winp: 0,
					pts: 0,
					cid: t2.cid,
					did: t2.did,
					wonDiv: t2.wonDiv,
					lostDiv: t2.lostDiv,
					otlDiv: t2.otlDiv ?? 0,
					tiedDiv: t2.tiedDiv ?? 0,
					wonConf: t2.wonConf,
					lostConf: t2.lostConf,
					otlConf: t2.otlConf ?? 0,
					tiedConf: t2.tiedConf ?? 0,
				},
				stats: {
					playoffs: false,
					pts: stats ? stats.pts : 0,
					oppPts: stats ? stats.oppPts : 0,
					gp: stats ? stats.gp : 0,
				},
			};

			// Even with gamesLeft 0, we still need this with skipTiebreakers because otherwise it will be overconfident despite knowing nothing about tiebreakers
			if (gamesLeft > 0 || skipTiebreakers) {
				if (t2.tid === t.tid) {
					// 0.1 extra is to simulate team losing all tie breakers
					worstCase.seasonAttrs.lost += gamesLeft + 0.1;
					worstCase.seasonAttrs.lostDiv += gamesLeft + 0.1;
					worstCase.seasonAttrs.lostConf += gamesLeft + 0.1;
				} else {
					worstCase.seasonAttrs.won += gamesLeft;
					worstCase.seasonAttrs.wonDiv += gamesLeft;
					worstCase.seasonAttrs.wonConf += gamesLeft;
				}
			}

			if (usePts) {
				worstCase.seasonAttrs.pts = evaluatePointsFormula(
					worstCase.seasonAttrs,
				);
			} else {
				worstCase.seasonAttrs.winp = helpers.calcWinp(worstCase.seasonAttrs);
			}

			return worstCase;
		});

		// w - clinched play-in tournament
		// x - clinched playoffs
		// y - if byes exist - clinched bye
		// z - clinched home court advantage
		// o - eliminated
		let clinchedPlayoffs: ClinchedPlayoffs;

		const result = await genPlayoffSeriesFromTeams(worstCases, {
			skipTiebreakers,
		});

		if (result.tidPlayIn.includes(t.tid)) {
			// Play-in dominates any other classification
			clinchedPlayoffs = "w";
		} else {
			const matchups = result.series[0];
			for (const matchup of matchups) {
				if (matchup.home.tid === t.tid && matchup.home.seed === 1) {
					clinchedPlayoffs = "z";
				} else if (!matchup.away && matchup.home.tid === t.tid) {
					clinchedPlayoffs = "y";
				}
			}

			if (!clinchedPlayoffs) {
				if (result.tidPlayoffs.includes(t.tid)) {
					clinchedPlayoffs = "x";
				}
			}
		}

		if (!clinchedPlayoffs) {
			const bestCases = teamSeasons.map(t2 => {
				const tied = t2.tied ?? 0;
				const otl = t2.otl ?? 0;
				const gp = t2.won + t2.lost + tied + otl;

				// finalStandings means the season is over, which matters because in some league structures not all teams will play the same number of games
				const gamesLeft = finalStandings ? 0 : g.get("numGames") - gp;

				const stats = teamStats.get(t2.tid);

				const bestCase = {
					tid: t2.tid,
					seasonAttrs: {
						won: t2.won,
						lost: t2.lost,
						otl,
						tied,
						winp: 0,
						pts: 0,
						cid: t2.cid,
						did: t2.did,
						wonDiv: t2.wonDiv,
						lostDiv: t2.lostDiv,
						otlDiv: t2.otlDiv ?? 0,
						tiedDiv: t2.tiedDiv ?? 0,
						wonConf: t2.wonConf,
						lostConf: t2.lostConf,
						otlConf: t2.otlConf ?? 0,
						tiedConf: t2.tiedConf ?? 0,
					},
					stats: {
						playoffs: false,
						pts: stats ? stats.pts : 0,
						oppPts: stats ? stats.oppPts : 0,
						gp: stats ? stats.gp : 0,
					},
				};

				if (gamesLeft > 0 || skipTiebreakers) {
					if (t2.tid === t.tid) {
						// 0.1 extra is to simulate team winning all tie breakers
						bestCase.seasonAttrs.won += gamesLeft + 0.1;
						bestCase.seasonAttrs.wonDiv += gamesLeft + 0.1;
						bestCase.seasonAttrs.wonConf += gamesLeft + 0.1;
					} else {
						bestCase.seasonAttrs.lost += gamesLeft;
						bestCase.seasonAttrs.lostDiv += gamesLeft;
						bestCase.seasonAttrs.lostConf += gamesLeft;
					}
				}

				if (usePts) {
					bestCase.seasonAttrs.pts = evaluatePointsFormula(
						bestCase.seasonAttrs,
					);
				} else {
					bestCase.seasonAttrs.winp = helpers.calcWinp(bestCase.seasonAttrs);
				}

				return bestCase;
			});

			const result = await genPlayoffSeriesFromTeams(bestCases, {
				skipTiebreakers,
			});
			if (
				!result.tidPlayoffs.includes(t.tid) &&
				!result.tidPlayIn.includes(t.tid)
			) {
				clinchedPlayoffs = "o";
			}
		}

		output.push(clinchedPlayoffs);
	}

	return output;
};

const updateClinchedPlayoffs = async (
	finalStandings: boolean,
	conditions: Conditions,
) => {
	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[g.get("season")], [g.get("season"), "Z"]],
	);
	const teamStatsArray = await idb.cache.teamStats.indexGetAll(
		"teamStatsByPlayoffsTid",
		[[false], [false, "Z"]],
	);
	const teamStats = new Map<number, TeamStats>();
	for (const row of teamStatsArray) {
		teamStats.set(row.tid, row);
	}

	const clinchedPlayoffs = await getClinchedPlayoffs(
		teamSeasons,
		teamStats,
		finalStandings,
	);

	let playoffsByConf: boolean | undefined;
	for (let i = 0; i < teamSeasons.length; i++) {
		const ts = teamSeasons[i];
		if (clinchedPlayoffs[i] !== ts.clinchedPlayoffs) {
			ts.clinchedPlayoffs = clinchedPlayoffs[i];

			let action = "";
			if (clinchedPlayoffs[i] === "w") {
				action = "clinched a play-in tournament spot";
			} else if (clinchedPlayoffs[i] === "x") {
				action = "clinched a playoffs spot";
			} else if (clinchedPlayoffs[i] === "y") {
				action = "clinched a first round bye";
			} else if (clinchedPlayoffs[i] === "z") {
				if (playoffsByConf === undefined) {
					playoffsByConf = await season.getPlayoffsByConf(g.get("season"));
				}
				action = `clinched ${playoffsByConf ? "a" : "the"} #1 seed`;
			} else if (clinchedPlayoffs[i] === "o") {
				action = "have been eliminated from playoff contention";
			}

			logEvent(
				{
					type: "playoffs",
					text: `The <a href="${helpers.leagueUrl([
						"roster",
						`${ts.abbrev}_${ts.tid}`,
						g.get("season"),
					])}">${ts.name}</a> ${action}.`,
					showNotification: ts.tid === g.get("userTid"),
					tids: [ts.tid],
					score: 10,
				},
				conditions,
			);

			await idb.cache.teamSeasons.put(ts);
		}
	}
};

export default updateClinchedPlayoffs;
