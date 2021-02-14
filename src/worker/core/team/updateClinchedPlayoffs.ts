import { idb } from "../../db";
import type { TeamSeason, Conditions, TeamStats } from "../../../common/types";
import { g, helpers, logEvent, orderTeams } from "../../util";
import { COURT } from "../../../common";
import { genPlayoffSeriesFromTeams } from "../season/genPlayoffSeries";

type ClinchedPlayoffs = TeamSeason["clinchedPlayoffs"];

const getClinchedPlayoffs = async (
	teamSeasons: TeamSeason[],
	teamStats: Map<number, TeamStats>,
	finalStandings: boolean,
) => {
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
			if (!stats) {
				throw new Error("Missing stats");
			}

			const worstCase = {
				tid: t2.tid,
				seasonAttrs: {
					won: t2.won,
					lost: t2.lost,
					otl,
					tied,
					winp: 0,
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
					pts: stats.pts,
					oppPts: stats.oppPts,
					gp: stats.gp,
				},
			};

			if (gamesLeft > 0) {
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
			worstCase.seasonAttrs.winp = helpers.calcWinp(worstCase.seasonAttrs);

			return worstCase;
		});

		// This is needed just to determine the overall #1 seed
		const sorted = await orderTeams(worstCases, worstCases, {
			skipTiebreakers,
		});

		// x - clinched playoffs
		// y - if byes exist - clinched bye
		// z - clinched home court advantage
		// o - eliminated
		let clinchedPlayoffs: ClinchedPlayoffs;

		if (sorted[0].tid === t.tid) {
			clinchedPlayoffs = "z";
		} else {
			const result = await genPlayoffSeriesFromTeams(worstCases, {
				skipTiebreakers,
			});
			const matchups = result.series[0];
			for (const matchup of matchups) {
				if (!matchup.away && matchup.home.tid === t.tid) {
					clinchedPlayoffs = "y";
					break;
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
				if (!stats) {
					throw new Error("Missing stats");
				}

				const bestCase = {
					tid: t2.tid,
					seasonAttrs: {
						won: t2.won,
						lost: t2.lost,
						otl,
						tied,
						winp: 0,
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
						pts: stats.pts,
						oppPts: stats.oppPts,
						gp: stats.gp,
					},
				};

				if (gamesLeft > 0) {
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
				bestCase.seasonAttrs.winp = helpers.calcWinp(bestCase.seasonAttrs);

				return bestCase;
			});

			const result = await genPlayoffSeriesFromTeams(bestCases, {
				skipTiebreakers,
			});
			if (!result.tidPlayoffs.includes(t.tid)) {
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

	for (let i = 0; i < teamSeasons.length; i++) {
		const ts = teamSeasons[i];
		if (clinchedPlayoffs[i] !== ts.clinchedPlayoffs) {
			ts.clinchedPlayoffs = clinchedPlayoffs[i];

			let action = "";
			if (clinchedPlayoffs[i] === "x") {
				action = "clinched a playoffs spot";
			} else if (clinchedPlayoffs[i] === "y") {
				action = "clinched a first round bye";
			} else if (clinchedPlayoffs[i] === "z") {
				action = `clinched the #1 overall seed and home ${COURT} advantage`;
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
