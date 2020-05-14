import { PHASE, PLAYER } from "../../common";
import { team } from "../core";
import { idb } from "../db";
import { g, getProcessedGames, helpers } from "../util";
import type { UpdateEvents, Game } from "../../common/types";
import { getUpcoming } from "./schedule";

const updateInbox = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("newPhase")) {
		const messages = await idb.getCopies.messages({
			limit: 2,
		});
		messages.reverse();
		return {
			messages: messages.map(message => ({
				mid: message.mid,
				read: message.read,
				year: message.year,
				from: message.from,
			})),
		};
	}
};

const updateTeam = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("newPhase")
	) {
		const [t, latestSeason] = await Promise.all([
			idb.cache.teams.get(g.get("userTid")),
			idb.cache.teamSeasons.indexGet("teamSeasonsBySeasonTid", [
				g.get("season"),
				g.get("userTid"),
			]),
		]);
		return {
			region: t.region,
			name: t.name,
			won: latestSeason !== undefined ? latestSeason.won : 0,
			lost: latestSeason !== undefined ? latestSeason.lost : 0,
			tied: latestSeason !== undefined ? latestSeason.tied : 0,
			ties: g.get("ties"),
			cash: latestSeason !== undefined ? latestSeason.cash / 1000 : 0,
			// [millions of dollars]
			salaryCap: g.get("salaryCap") / 1000,
			// [millions of dollars]
			season: g.get("season"),
			playoffRoundsWon:
				latestSeason !== undefined ? latestSeason.playoffRoundsWon : 0,
			userTid: g.get("userTid"),
		};
	}
};

const updatePayroll = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement")
	) {
		const payroll = await team.getPayroll(g.get("userTid"));
		return {
			payroll: payroll / 1000, // [millions of dollars]
		};
	}
};

const updateTeams = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("newPhase")
	) {
		const stats =
			process.env.SPORT === "basketball"
				? (["pts", "oppPts", "trb", "ast"] as const)
				: ([
						"ptsPerGame",
						"oppPtsPerGame",
						"pssYdsPerGame",
						"rusYdsPerGame",
				  ] as const);
		const statNames =
			process.env.SPORT === "basketball"
				? ["Points", "Allowed", "Rebounds", "Assists"]
				: ["Points", "Allowed", "PssYds", "RusYds"];
		const teams = helpers.orderByWinp(
			await idb.getCopies.teamsPlus({
				attrs: ["tid"],
				seasonAttrs: ["won", "winp", "att", "revenue", "profit", "cid", "did"],
				stats,
				season: g.get("season"),
			}),
		);
		const t = teams.find(t2 => t2.tid === g.get("userTid"));
		const cid = t !== undefined ? t.seasonAttrs.cid : undefined;
		let att = 0;
		let rank = 1;
		let revenue = 0;
		let profit = 0;
		let teamStats: {
			name: string;
			rank: number;
			stat: string;
			value: number;
		}[] = [];

		for (const t2 of teams) {
			if (t2.seasonAttrs.cid === cid) {
				if (t2.tid === g.get("userTid")) {
					// @ts-ignore
					teamStats = stats.map((stat, i) => {
						return {
							name: statNames[i],
							rank: 0,
							stat,
							// @ts-ignore
							value: t2.stats[stat],
						};
					});
					att = t2.seasonAttrs.att;
					revenue = t2.seasonAttrs.revenue;
					profit = t2.seasonAttrs.profit;
					break;
				} else {
					rank += 1;
				}
			}
		}

		for (const stat of stats) {
			// @ts-ignore
			teams.sort((a, b) => b.stats[stat] - a.stats[stat]);

			for (let j = 0; j < teams.length; j++) {
				if (teams[j].tid === g.get("userTid")) {
					const entry = teamStats.find(teamStat => teamStat.stat === stat);

					if (entry) {
						entry.rank = j + 1;

						if (stat.startsWith("opp")) {
							entry.rank = g.get("numTeams") + 1 - entry.rank;
						}
					}

					break;
				}
			}
		}

		return {
			att,
			rank,
			revenue,
			profit,
			teamStats,
		};
	}
};

const updateGames = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
	state: {
		completed?: Game[];
	},
) => {
	const NUM_SHOW_COMPLETED = 4;

	if (updateEvents.includes("firstRun")) {
		// Load all games in list - would be more efficient to just load NUM_SHOW_COMPLETED
		const games = await getProcessedGames(
			g.get("teamAbbrevsCache")[g.get("userTid")],
			g.get("season"),
			undefined,
			true,
		);
		const completed = games.slice(0, NUM_SHOW_COMPLETED);
		return {
			completed,
		};
	}

	if (updateEvents.includes("gameSim")) {
		const completed = Array.isArray(state.completed) ? state.completed : []; // Partial update of only new games

		const games = await getProcessedGames(
			g.get("teamAbbrevsCache")[g.get("userTid")],
			g.get("season"),
			state.completed,
			true,
		);

		for (let i = games.length - 1; i >= 0; i--) {
			completed.unshift(games[i]);

			if (completed.length > NUM_SHOW_COMPLETED) {
				completed.pop();
			}
		}

		return {
			completed,
		};
	}
};

const updateSchedule = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const upcoming = await getUpcoming({
			tid: g.get("userTid"),
			limit: 3,
		});

		return {
			upcoming,
		};
	}
};

const updatePlayers = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("newPhase")
	) {
		const startersStats =
			process.env.SPORT === "basketball"
				? ["gp", "min", "pts", "trb", "ast", "per"]
				: ["gp", "keyStats"];
		const leaderStats =
			process.env.SPORT === "basketball"
				? ["pts", "trb", "ast"]
				: ["pssYds", "rusYds", "recYds"];
		const playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
		const players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"name",
				"abbrev",
				"tid",
				"age",
				"contract",
				"rosterOrder",
				"injury",
				"watch",
			],
			ratings: ["ovr", "pot", "dovr", "dpot", "skills", "pos"],
			stats: [...startersStats, ...leaderStats, "yearsWithTeam"],
			season: g.get("season"),
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});

		// League leaders
		const leagueLeaders: {
			abbrev: string;
			name: string;
			pid: number;
			stat: string;
			tid: number;
			value: number;
		}[] = [];

		for (const stat of leaderStats) {
			if (players.length > 0) {
				players.sort((a, b) => b.stats[stat] - a.stats[stat]);
				leagueLeaders.push({
					abbrev: players[0].abbrev,
					name: players[0].name,
					pid: players[0].pid,
					stat,
					tid: players[0].tid,
					value: players[0].stats[stat],
				});
			} else {
				leagueLeaders.push({
					abbrev: g.get("teamAbbrevsCache")[g.get("userTid")],
					name: "",
					pid: 0,
					stat,
					tid: g.get("userTid"),
					value: 0,
				});
			}
		}

		// Team leaders
		const userPlayers = players.filter(p => p.tid === g.get("userTid"));
		const teamLeaders: {
			name: string;
			pid: number;
			stat: string;
			value: number;
		}[] = [];

		for (const stat of leaderStats) {
			if (userPlayers.length > 0) {
				userPlayers.sort((a, b) => b.stats[stat] - a.stats[stat]);
				teamLeaders.push({
					name: userPlayers[0].name,
					pid: userPlayers[0].pid,
					stat,
					value: userPlayers[0].stats[stat],
				});
			} else {
				teamLeaders.push({
					name: "",
					pid: 0,
					stat,
					value: 0,
				});
			}
		}

		// Roster
		// Find starting 5 or top 5
		if (process.env.SPORT === "basketball") {
			userPlayers.sort((a, b) => a.rosterOrder - b.rosterOrder);
		} else {
			userPlayers.sort((a, b) => b.ratings.ovr - a.ratings.ovr);
		}

		const starters = userPlayers.slice(0, 5);
		return {
			leagueLeaders,
			teamLeaders,
			starters,
			startersStats,
		};
	}
};

const updatePlayoffs = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		(g.get("phase") >= PHASE.PLAYOFFS && updateEvents.includes("gameSim")) ||
		(updateEvents.includes("newPhase") && g.get("phase") === PHASE.PLAYOFFS)
	) {
		const playoffSeries = await idb.getCopy.playoffSeries({
			season: g.get("season"),
		});
		let foundSeries;
		let seriesTitle = "";
		let showPlayoffSeries = false;
		let numGamesToWinSeries = 4;

		if (playoffSeries !== undefined) {
			const series = playoffSeries.series;
			await helpers.augmentSeries(series); // Find the latest playoff series with the user's team in it

			let found = false;

			for (let rnd = playoffSeries.currentRound; rnd >= 0; rnd--) {
				for (let i = 0; i < series[rnd].length; i++) {
					const { away, home } = series[rnd][i];
					if (
						home.tid === g.get("userTid") ||
						(away && away.tid === g.get("userTid"))
					) {
						foundSeries = series[rnd][i];
						found = true;
						showPlayoffSeries = true;

						if (rnd === 0) {
							seriesTitle = "First Round";
						} else if (rnd === 1) {
							seriesTitle = "Second Round";
						} else if (rnd === 2) {
							seriesTitle = "Conference Finals";
						} else if (rnd === 3) {
							seriesTitle = "League Finals";
						}

						numGamesToWinSeries = helpers.numGamesToWinSeries(
							g.get("numGamesPlayoffSeries")[rnd],
						);
						break;
					}
				}

				if (found) {
					break;
				}
			}
		}

		return {
			numConfs: g.get("confs").length,
			numGamesToWinSeries,
			numPlayoffRounds: g.get("numGamesPlayoffSeries").length,
			series: foundSeries,
			seriesTitle,
			showPlayoffSeries,
		};
	}
};

const updateStandings = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
		const teams = helpers.orderByWinp(
			await idb.getCopies.teamsPlus({
				attrs: ["tid"],
				seasonAttrs: ["won", "lost", "winp", "cid", "did", "abbrev", "region"],
				season: g.get("season"),
			}),
		);

		// Find user's conference
		let cid;

		for (const t of teams) {
			if (t.tid === g.get("userTid")) {
				cid = t.seasonAttrs.cid;
				break;
			}
		}

		const confTeams: (typeof teams[number] & {
			rank: number;
			gb: number;
		})[] = [];

		let rank = 1;
		for (let k = 0; k < teams.length; k++) {
			if (cid === teams[k].seasonAttrs.cid) {
				confTeams.push({
					...helpers.deepCopy(teams[k]),
					rank,
					gb:
						rank === 1
							? 0
							: helpers.gb(confTeams[0].seasonAttrs, teams[k].seasonAttrs),
				});

				rank += 1;
			}
		}

		const numPlayoffTeams =
			(2 ** g.get("numGamesPlayoffSeries").length - g.get("numPlayoffByes")) /
			2;
		const playoffsByConference = g.get("confs").length === 2;
		return {
			confTeams,
			numPlayoffTeams,
			playoffsByConference,
		};
	}
};

export default async (
	inputs: unknown,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// Woo TypeScript, gotta break this up into 3 parts or it just says fuck it and calls it any
	const part1 = Object.assign(
		{},
		await updateInbox(inputs, updateEvents),
		await updateTeam(inputs, updateEvents),
		await updatePayroll(inputs, updateEvents),
	);
	const part2 = Object.assign(
		{},
		await updateTeams(inputs, updateEvents),
		await updateGames(inputs, updateEvents, state),
		await updateSchedule(inputs, updateEvents),
	);
	const part3 = Object.assign(
		{},
		await updatePlayers(inputs, updateEvents),
		await updatePlayoffs(inputs, updateEvents),
		await updateStandings(inputs, updateEvents),
	);

	return Object.assign({}, part1, part2, part3);
};
