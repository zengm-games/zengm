import { idb } from "../../db";
import type { TeamSeason, Conditions, TeamStats } from "../../../common/types";
import { g, helpers, logEvent } from "../../util";
import {
	genPlayoffSeriesFromTeams,
	getTidPlayIns,
} from "../season/genPlayoffSeries";
import evaluatePointsFormula from "./evaluatePointsFormula";
import { season } from "..";

type ClinchedPlayoffs = TeamSeason["clinchedPlayoffs"];

const getClinchedPlayoffs = async (
	teamSeasons: TeamSeason[],
	teamStats: Map<number, TeamStats>,
) => {
	if (g.get("numGamesPlayoffSeries").length === 0) {
		return teamSeasons.map(() => undefined);
	}

	const usePts = g.get("pointsFormula", "current") !== "";

	// We can skip tiebreakers because we add an extra 0.1 to the best/worst case win totals. Without skipping tiebreakers, it's way too slow.
	const skipTiebreakers = true;

	const output: ClinchedPlayoffs[] = [];
	for (const t of teamSeasons) {
		const worstCases = teamSeasons.map(t2 => {
			const gp = helpers.getTeamSeasonGp(t2);

			// Will be wrong if a team is missing a game due to scheduling constraints
			const gamesLeft = g.get("numGames") - gp;

			const stats = teamStats.get(t2.tid);

			const worstCase = {
				tid: t2.tid,
				seasonAttrs: {
					won: t2.won,
					lost: t2.lost,
					otl: t2.otl,
					tied: t2.tied,
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
		// z - clinched #1 seed
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
				const gp = helpers.getTeamSeasonGp(t2);

				// Will be wrong if a team is missing a game due to scheduling constraints
				const gamesLeft = g.get("numGames") - gp;

				const stats = teamStats.get(t2.tid);

				const bestCase = {
					tid: t2.tid,
					seasonAttrs: {
						won: t2.won,
						lost: t2.lost,
						otl: t2.otl,
						tied: t2.tied,
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

// We already know the playoff matchups, so just use those to derive the final clinched playoffs status. Much faster this way than running getClinchedPlayoffs with tiebreakers!
const getClinchedPlayoffsFinal = async (teamSeasons: TeamSeason[]) => {
	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	if (!playoffSeries) {
		throw new Error("playoffSeries not found");
	}

	const playoffTids: number[] = [];
	const byeTids: number[] = [];
	const topSeedTids: number[] = [];

	const firstRound = playoffSeries.series[0];
	if (firstRound) {
		for (const { away, home } of firstRound) {
			if (home.seed === 1) {
				topSeedTids.push(home.tid);
			} else if (!away) {
				byeTids.push(home.tid);
			} else {
				playoffTids.push(home.tid);
			}

			if (away && !away.pendingPlayIn) {
				playoffTids.push(away.tid);
			}
		}
	}

	const playInTids = playoffSeries.playIns
		? getTidPlayIns(playoffSeries.playIns)
		: [];

	// w - clinched play-in tournament
	// x - clinched playoffs
	// y - if byes exist - clinched bye
	// z - clinched #1 seed
	// o - eliminated
	return teamSeasons.map(({ tid }) => {
		if (playInTids.includes(tid)) {
			return "w";
		}

		if (topSeedTids.includes(tid)) {
			return "z";
		}

		if (byeTids.includes(tid)) {
			return "y";
		}

		if (playoffTids.includes(tid)) {
			return "x";
		}

		return "o";
	});
};

const updateClinchedPlayoffs = async (
	finalStandings: boolean,
	conditions: Conditions,
) => {
	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[g.get("season")], [g.get("season"), "Z"]],
	);

	let clinchedPlayoffs: ClinchedPlayoffs[];
	if (finalStandings) {
		// MUST BE AFTER PLAYOFF SERIES ARE SET!
		clinchedPlayoffs = await getClinchedPlayoffsFinal(teamSeasons);
	} else {
		const teamStatsArray = await idb.cache.teamStats.indexGetAll(
			"teamStatsByPlayoffsTid",
			[[false], [false, "Z"]],
		);
		const teamStats = new Map<number, TeamStats>();
		for (const row of teamStatsArray) {
			teamStats.set(row.tid, row);
		}

		clinchedPlayoffs = await getClinchedPlayoffs(teamSeasons, teamStats);
	}

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
