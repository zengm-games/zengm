import { bySport, isSport, PHASE, PLAYER } from "../../common/index.ts";
import { season, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g, helpers, orderTeams } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import { processEvents } from "./news.ts";
import { getMaxPlayoffSeed } from "./standings.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";

const updateInbox = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("newPhase")) {
		const messages = await idb.getCopies.messages(
			{
				limit: 2,
			},
			"noCopyCache",
		);
		messages.reverse();
		return {
			messages: messages.map((message) => ({
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

		const playoffRoundsWon = latestSeason?.playoffRoundsWon ?? -1;
		const playoffsByConf = await season.getPlayoffsByConf(g.get("season"));
		const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;
		const roundsWonText = helpers.upperCaseFirstLetter(
			helpers.roundsWonText({
				playoffRoundsWon,
				numPlayoffRounds,
				playoffsByConf,
				season: g.get("season"),
			}),
		);

		return {
			region: t?.region ?? "",
			name: t?.name ?? "",
			won: latestSeason?.won ?? 0,
			lost: latestSeason?.lost ?? 0,
			tied: latestSeason?.tied ?? 0,
			otl: latestSeason?.otl ?? 0,
			cash: latestSeason ? latestSeason.cash / 1000 : 0,
			salaryCap: g.get("salaryCap") / 1000,
			salaryCapType: g.get("salaryCapType"),
			luxuryPayroll: g.get("luxuryPayroll") / 1000,
			season: g.get("season"),
			playoffRoundsWon,
			roundsWonText,
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
		const stats = bySport({
			baseball: ["pts", "oppPts", "ops", "era"] as const,
			basketball: ["pts", "oppPts", "trb", "ast"] as const,
			football: [
				"ptsPerGame",
				"oppPtsPerGame",
				"pssYdsPerGame",
				"rusYdsPerGame",
			] as const,
			hockey: ["g", "oppG"] as const,
		});
		const statNames = bySport({
			baseball: ["Runs", "Allowed", "OPS", "ERA"],
			basketball: ["Points", "Allowed", "Rebounds", "Assists"],
			football: ["Points", "Allowed", "PssYds", "RusYds"],
			hockey: ["Goals", "Allowed"],
		});
		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				seasonAttrs: [
					"won",
					"lost",
					"otl",
					"tied",
					"winp",
					"pts",
					"att",
					"revenue",
					"profit",
					"cid",
					"did",
					"wonDiv",
					"lostDiv",
					"tiedDiv",
					"otlDiv",
					"wonConf",
					"lostConf",
					"tiedConf",
					"otlConf",
				],
				stats: ["pts", "oppPts", "gp", ...stats] as const,
				season: g.get("season"),
				showNoStats: true,
			},
			"noCopyCache",
		);
		const t = teams.find((t2) => t2.tid === g.get("userTid"));
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

		const playoffsByConf = await season.getPlayoffsByConf(g.get("season"));
		const teamsRank = await orderTeams(
			teams.filter(
				(t) => playoffsByConf === false || t.seasonAttrs.cid === cid,
			),
			teams,
		);

		for (const t2 of teamsRank) {
			if (playoffsByConf === false || t2.seasonAttrs.cid === cid) {
				if (t2.tid === g.get("userTid")) {
					teamStats = stats.map((stat, i) => {
						return {
							name: statNames[i]!,
							rank: 0,
							stat,
							value: (t2.stats as any)[stat],
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
			teams.sort((a, b) => (b.stats as any)[stat] - (a.stats as any)[stat]);

			for (const [j, t] of teams.entries()) {
				if (t.tid === g.get("userTid")) {
					const entry = teamStats.find((teamStat) => teamStat.stat === stat);

					if (entry) {
						entry.rank = j + 1;

						if (
							stat.startsWith("opp") ||
							(isSport("baseball") && stat === "era")
						) {
							entry.rank = teams.length + 1 - entry.rank;
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

const updatePlayers = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("newPhase")
	) {
		const startersStats = bySport({
			baseball: ["hr", "ba", "ops", "era", "ip"],
			basketball: ["gp", "min", "pts", "trb", "ast", "per"],
			football: ["gp", "keyStats", "av"],
			hockey: ["gp", "keyStats", "ops", "dps", "ps"],
		});
		const leaderStats = bySport({
			baseball: ["hr", "h", "w"],
			basketball: ["pts", "trb", "ast"],
			football: ["pssYds", "rusYds", "recYds"],
			hockey: ["g", "a", "pts"],
		});
		const playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);

		// League leaders
		const leaderPlayers = await idb.getCopies.playersPlus(playersAll, {
			attrs: ["pid", "firstName", "lastName", "abbrev", "tid"],
			stats: leaderStats,
			season: g.get("season"),
			showNoStats: true,
			showRookies: true,
			mergeStats: "totOnly",
		});

		const leagueLeaders: {
			abbrev: string;
			firstName: string;
			lastName: string;
			pid: number;
			stat: string;
			tid: number;
			value: number;
		}[] = [];

		for (const stat of leaderStats) {
			if (leaderPlayers.length > 0) {
				leaderPlayers.sort((a, b) => b.stats[stat] - a.stats[stat]);
				leagueLeaders.push({
					abbrev: leaderPlayers[0].abbrev,
					firstName: leaderPlayers[0].firstName,
					lastName: leaderPlayers[0].lastName,
					pid: leaderPlayers[0].pid,
					stat,
					tid: leaderPlayers[0].tid,
					value: leaderPlayers[0].stats[stat],
				});
			} else {
				leagueLeaders.push({
					abbrev: g.get("teamInfoCache")[g.get("userTid")]!.abbrev,
					firstName: "",
					lastName: "",
					pid: 0,
					stat,
					tid: g.get("userTid"),
					value: 0,
				});
			}
		}

		const userPlayers = addFirstNameShort(
			await idb.getCopies.playersPlus(
				playersAll.filter((p) => p.tid === g.get("userTid")),
				{
					attrs: [
						"pid",
						"firstName",
						"lastName",
						"abbrev",
						"tid",
						"age",
						"contract",
						"draft",
						"rosterOrder",
						"injury",
						"watch",
						"jerseyNumber",
					],
					ratings: ["ovr", "pot", "dovr", "dpot", "skills", "pos"],
					stats: [...startersStats, ...leaderStats, "yearsWithTeam"],
					season: g.get("season"),
					showNoStats: true,
					showRookies: true,
					fuzz: true,
					tid: g.get("userTid"),
				},
			),
		);

		// Team leaders
		const teamLeaders: {
			firstName: string;
			firstNameShort: string;
			lastName: string;
			pid: number;
			stat: string;
			value: number;
		}[] = [];

		for (const stat of leaderStats) {
			if (userPlayers.length > 0) {
				userPlayers.sort((a, b) => b.stats[stat] - a.stats[stat]);
				teamLeaders.push({
					firstName: userPlayers[0].firstName,
					firstNameShort: userPlayers[0].firstNameShort,
					lastName: userPlayers[0].lastName,
					pid: userPlayers[0].pid,
					stat,
					value: userPlayers[0].stats[stat],
				});
			} else {
				teamLeaders.push({
					firstName: "",
					firstNameShort: "",
					lastName: "",
					pid: 0,
					stat,
					value: 0,
				});
			}
		}

		// Roster
		// Find starters or top 5 players
		let starters;
		const numPlayersOnCourt = g.get("numPlayersOnCourt");
		if (isSport("basketball")) {
			userPlayers.sort((a, b) => a.rosterOrder - b.rosterOrder);
			starters = userPlayers.slice(0, Math.max(5, numPlayersOnCourt));
		} else if (isSport("hockey")) {
			const t = await idb.cache.teams.get(g.get("userTid"));
			if (t) {
				const depth = t.depth as any;
				const pids = [
					depth.F[0],
					depth.F[1],
					depth.F[2],
					depth.D[0],
					depth.D[1],
					depth.G[0],
				];
				starters = pids
					.map((pid) => userPlayers.find((p) => p.pid === pid))
					.filter((pid) => pid !== undefined);
			}
		}

		if (!starters) {
			// Football - too many starters, just show top 5. Also fallback for hockey depth chart missing
			userPlayers.sort((a, b) => b.ratings.ovr - a.ratings.ovr);
			starters = userPlayers.slice(0, 5);
		}

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			leagueLeaders: addFirstNameShort(leagueLeaders),
			numPlayersOnCourt,
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
		(updateEvents.includes("newPhase") &&
			(g.get("phase") === PHASE.PLAYOFFS || g.get("phase") === PHASE.PRESEASON))
	) {
		const playoffSeries = await idb.getCopy.playoffSeries({
			season: g.get("season"),
		});
		let foundSeries;
		let seriesTitle = "";
		let showPlayoffSeries = false;
		let numGamesToWinSeries = 4;

		if (playoffSeries !== undefined && playoffSeries.series.length > 0) {
			const series = playoffSeries.series;
			await helpers.augmentSeries(series);

			// Find the latest playoff series with the user's team in it

			let found = false;

			const playoffsByConf = await season.getPlayoffsByConf(g.get("season"));
			const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;

			// This is needed since currentRound is -1 for a play-in
			const lastRound =
				playoffSeries.currentRound >= 0 ? playoffSeries.currentRound : 0;

			for (let rnd = lastRound; rnd >= 0; rnd--) {
				for (const [i, { away, home }] of series[rnd]!.entries()) {
					if (
						home.tid === g.get("userTid") ||
						(away && away.tid === g.get("userTid") && !away.pendingPlayIn)
					) {
						foundSeries = series[rnd]![i];
						found = true;
						showPlayoffSeries = true;

						seriesTitle = helpers.upperCaseFirstLetter(
							helpers.playoffRoundName({
								currentRound: rnd,
								numPlayoffRounds,
								playoffsByConf,
								season: g.get("season"),
							}).name,
						);
						numGamesToWinSeries = helpers.numGamesToWinSeries(
							g.get("numGamesPlayoffSeries", "current")[rnd],
						);
						break;
					}
				}

				if (found) {
					break;
				}
			}

			const playIns = playoffSeries.playIns;
			if (!found && playIns) {
				await helpers.augmentSeries(playIns);
				for (const playIn of playIns) {
					for (let i = playIn.length - 1; i >= 0; i--) {
						const { away, home } = playIn[i]!;
						if (
							home.tid === g.get("userTid") ||
							away.tid === g.get("userTid")
						) {
							foundSeries = playIn[i];
							found = true;
							showPlayoffSeries = true;

							seriesTitle = helpers.upperCaseFirstLetter(
								helpers.playoffRoundName({
									currentRound: -1,
									numPlayoffRounds,
									playoffsByConf,
									season: g.get("season"),
								}).name,
							);

							numGamesToWinSeries = 1;
							break;
						}
					}

					if (found) {
						break;
					}
				}
			}
		}

		return {
			numConfs: g.get("confs", "current").length,
			numGamesToWinSeries,
			series: foundSeries,
			seriesTitle,
			showPlayoffSeries,
		};
	}
};

const updateStandings = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				seasonAttrs: [
					"won",
					"lost",
					"tied",
					"otl",
					"wonDiv",
					"lostDiv",
					"tiedDiv",
					"otlDiv",
					"wonConf",
					"lostConf",
					"tiedConf",
					"otlConf",
					"winp",
					"pts",
					"cid",
					"did",
					"abbrev",
					"region",
					"clinchedPlayoffs",
					"imgURL",
					"imgURLSmall",
				],
				stats: ["pts", "oppPts", "gp"] as const,
				season: g.get("season"),
				showNoStats: true,
			},
			"noCopyCache",
		);

		// Find user's conference
		let cid: number | undefined;
		for (const t of teams) {
			if (t.tid === g.get("userTid")) {
				cid = t.seasonAttrs.cid;
				break;
			}
		}

		const confTeams: ((typeof teams)[number] & {
			rank: number;
			gb: number;
		})[] = (
			await orderTeams(
				teams.filter((t) => t.seasonAttrs.cid === cid),
				teams,
			)
		).map((t) => ({
			...t,
			rank: 0,
			gb: 0,
		}));

		const pointsFormula = g.get("pointsFormula", "current");
		const usePts = pointsFormula !== "";

		let rank = 1;
		for (const t of confTeams) {
			if (cid === t.seasonAttrs.cid) {
				t.rank = rank;
				if (!usePts) {
					t.gb =
						rank === 1
							? 0
							: helpers.gb(confTeams[0]!.seasonAttrs, t.seasonAttrs);
				}

				rank += 1;
			}
		}

		const playoffsByConf = await season.getPlayoffsByConf(g.get("season"));
		const { maxPlayoffSeed, maxPlayoffSeedNoPlayIn } = await getMaxPlayoffSeed(
			g.get("season"),
			playoffsByConf,
		);

		return {
			confTeams,
			maxPlayoffSeed,
			maxPlayoffSeedNoPlayIn,
			playoffsByConf,
			pointsFormula,
			usePts,
		};
	}
};

const updateNewsFeed = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const NUM_EVENTS = 8;

		// Load all events from this season, and last season too if more are needed
		const eventsAll = await idb.getCopies.events({
			season: g.get("season"),
		});
		eventsAll.reverse();

		const events = await processEvents(eventsAll, {
			limit: NUM_EVENTS,
		});
		if (events.length < NUM_EVENTS) {
			const eventsAll2 = await idb.getCopies.events({
				season: g.get("season") - 1,
			});
			eventsAll2.reverse();
			const events2 = await processEvents(eventsAll2, {
				limit: NUM_EVENTS - events.length,
			});
			events.push(...events2);
		}

		const teams = (
			await idb.getCopies.teamsPlus(
				{
					seasonAttrs: [
						"abbrev",
						"colors",
						"jersey",
						"imgURL",
						"imgURLSmall",
						"region",
					],
					season: g.get("season"),
					addDummySeason: true,
				},
				"noCopyCache",
			)
		).map((t) => t.seasonAttrs);

		return {
			events,
			teams,
		};
	}
};

export default async (inputs: unknown, updateEvents: UpdateEvents) => {
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
		await updateNewsFeed(inputs, updateEvents),
	);
	const part3 = Object.assign(
		{},
		await updatePlayers(inputs, updateEvents),
		await updatePlayoffs(inputs, updateEvents),
		await updateStandings(inputs, updateEvents),
	);

	return Object.assign({}, part1, part2, part3);
};
