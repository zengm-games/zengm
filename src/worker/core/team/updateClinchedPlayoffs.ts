import { idb } from "../../db/index.ts";
import type {
	TeamSeason,
	Conditions,
	TeamStats,
	ByConf,
} from "../../../common/types.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import {
	genPlayoffSeriesFromTeams,
	getTidPlayIns,
} from "../season/genPlayoffSeries.ts";
import { getHypotheticalTeam } from "./getHypotheticalTeam.ts";
import { season } from "../index.ts";

type ClinchedPlayoffs = TeamSeason["clinchedPlayoffs"];

const getClinchedPlayoffs = async (
	teamSeasons: TeamSeason[],
	teamStats: Map<number, TeamStats>,
) => {
	if (g.get("numGamesPlayoffSeries").length === 0) {
		return teamSeasons.map(() => undefined);
	}

	const usePts = g.get("pointsFormula", "current") !== "";

	const schedule = await season.getSchedule();
	const gamesLeftByTid: Record<number, number> = {};
	for (const t of teamSeasons) {
		gamesLeftByTid[t.tid] = 0;
	}
	for (const { awayTid, homeTid } of schedule) {
		if (gamesLeftByTid[awayTid] !== undefined) {
			gamesLeftByTid[awayTid] += 1;
		}
		if (gamesLeftByTid[homeTid] !== undefined) {
			gamesLeftByTid[homeTid] += 1;
		}
	}

	const getGamesLeft = (tid: number) => {
		const gamesLeft = gamesLeftByTid[tid];
		if (gamesLeft === undefined) {
			throw new Error("Should never happen");
		}
		return gamesLeft;
	};

	// We can skip tiebreakers because we add an extra 0.1 to the best/worst case win totals. Without skipping tiebreakers, it's way too slow. You could imagine using tiebreakers only on the last few games of the season... but really it doesn't even work. The bestCases check below isn't actually using the schedule, and it doesn't consider all permutations of game outcomes (which technically would be necessary for all possible tiebreakers) - that would be needed.
	// const skipTiebreakers = teamSeasons.every(row => numGames - helpers.getTeamSeasonGp(row) > 3);
	const skipTiebreakers = true;

	const output: ClinchedPlayoffs[] = [];
	for (const t of teamSeasons) {
		const worstCases = teamSeasons.map((t2) => {
			const gamesLeft = getGamesLeft(t2.tid);

			// Even with gamesLeft 0, we still need this with skipTiebreakers because otherwise it will be overconfident despite knowing nothing about tiebreakers
			const applyGamesLeft = gamesLeft > 0 || skipTiebreakers;

			return getHypotheticalTeam({
				teamSeason: t2,
				teamStats: teamStats.get(t2.tid),
				won: applyGamesLeft && t2.tid !== t.tid ? gamesLeft : 0,

				// 0.1 extra is to simulate team losing all tie breakers
				lost: applyGamesLeft && t2.tid === t.tid ? gamesLeft + 0.1 : 0,
				usePts,
			});
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
			const matchups = result.series[0]!;
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
			const bestCases = teamSeasons.map((t2) => {
				const gamesLeft = getGamesLeft(t2.tid);
				const applyGamesLeft = gamesLeft > 0 || skipTiebreakers;

				return getHypotheticalTeam({
					teamSeason: t2,
					teamStats: teamStats.get(t2.tid),

					// 0.1 extra is to simulate team winning all tie breakers
					won: applyGamesLeft && t2.tid === t.tid ? gamesLeft + 0.1 : 0,
					lost: applyGamesLeft && t2.tid !== t.tid ? gamesLeft : 0,
					usePts,
				});
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

	let playoffsByConf: ByConf | undefined;
	for (const [i, ts] of teamSeasons.entries()) {
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
