import { bySport, isSport, PHASE } from "../../../common";
import { team } from "..";
import { idb } from "../../db";
import { g, helpers } from "../../util";
import type { GameResults } from "../../../common/types";
import {
	getActualAttendance,
	getAdjustedTicketPrice,
	getAutoTicketPrice,
	getBaseAttendance,
} from "./attendance";
import { levelToAmount } from "../../../common/budgetLevels";

const writeTeamStats = async (results: GameResults) => {
	const allStarGame = results.team[0].id === -1 && results.team[1].id === -2;

	if (allStarGame) {
		return g.get("defaultStadiumCapacity");
	}

	let baseAttendance = 0;
	let attendance = 0;
	let adjustedTicketPrice = 0;

	for (const t1 of [0, 1]) {
		const t2 = t1 === 1 ? 0 : 1;
		const payroll = await team.getPayroll(results.team[t1].id);
		const t = await idb.cache.teams.get(results.team[t1].id);
		const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
			"teamSeasonsByTidSeason",
			[
				[results.team[t1].id, g.get("season") - 2],
				[results.team[t1].id, g.get("season")],
			],
		);
		const teamSeason = teamSeasons.at(-1)!;
		const won = results.team[t1].stat.pts > results.team[t2].stat.pts;
		const lost = results.team[t1].stat.pts < results.team[t2].stat.pts;

		const playoffs = g.get("phase") === PHASE.PLAYOFFS;
		let teamStats = await idb.cache.teamStats.indexGet(
			"teamStatsByPlayoffsTid",
			[playoffs, results.team[t1].id],
		);
		if (!teamStats) {
			teamStats = team.genStatsRow(results.team[t1].id, playoffs);
		}

		if (!t) {
			throw new Error("Invalid tid");
		}

		// Attendance - base calculation now, which is used for other revenue estimates. Base on the home team
		if (t1 === 0) {
			const playoffs = g.get("phase") === PHASE.PLAYOFFS;

			baseAttendance = getBaseAttendance({
				hype: teamSeason.hype,
				pop: teamSeason.pop,
				playoffs,
			});

			if (t.autoTicketPrice !== false || !g.get("userTids").includes(t.tid)) {
				const ticketPrice = await getAutoTicketPrice({
					hype: teamSeason.hype,
					pop: teamSeason.pop,
					stadiumCapacity: teamSeason.stadiumCapacity,
					teamSeasons,
					tid: teamSeason.tid,
				});
				t.budget.ticketPrice = ticketPrice;
			}

			adjustedTicketPrice = getAdjustedTicketPrice(
				t.budget.ticketPrice,
				playoffs,
			);
		}

		// Some things are only paid for regular season games.
		let salaryPaid = 0;
		let scoutingPaid = 0;
		let coachingPaid = 0;
		let healthPaid = 0;
		let facilitiesPaid = 0;
		let merchRevenue = 0;
		let sponsorRevenue = 0;
		let nationalTvRevenue = 0;
		let localTvRevenue = 0;

		if (g.get("phase") !== PHASE.PLAYOFFS) {
			// All in [thousands of dollars]
			const salaryCap = g.get("salaryCap");
			salaryPaid = payroll / g.get("numGames");
			scoutingPaid =
				levelToAmount(t.budget.scouting, salaryCap) / g.get("numGames");
			coachingPaid =
				levelToAmount(t.budget.coaching, salaryCap) / g.get("numGames");
			healthPaid =
				levelToAmount(t.budget.health, salaryCap) / g.get("numGames");
			facilitiesPaid =
				levelToAmount(t.budget.facilities, salaryCap) / g.get("numGames");

			const salaryCapFactor =
				salaryCap /
				bySport({
					// defaultGameAttributes.salaryCap, but frozen in time because otherwise various coefficients below would need to be updated when it changes
					baseball: 175000,
					basketball: 90000,
					football: 200000,
					hockey: 80000,
				});

			// Only different for hockey
			let salaryCapFactor2;
			if (isSport("hockey")) {
				// Legacy, should probably adjust other params
				salaryCapFactor2 = salaryCap / 90000;
			} else {
				salaryCapFactor2 = salaryCapFactor;
			}

			if (
				bySport({
					baseball: true,
					basketball: true,
					football: false,
					hockey: true,
				})
			) {
				merchRevenue = (salaryCapFactor2 * 4.5 * baseAttendance) / 1000;

				if (merchRevenue > salaryCapFactor * 250) {
					merchRevenue = salaryCapFactor * 250;
				}

				sponsorRevenue = (salaryCapFactor2 * 15 * baseAttendance) / 1000;

				if (sponsorRevenue > salaryCapFactor * 600) {
					sponsorRevenue = salaryCapFactor * 600;
				}

				nationalTvRevenue = salaryCapFactor2 * 375;
				localTvRevenue = (salaryCapFactor2 * 15 * baseAttendance) / 1000;

				if (localTvRevenue > salaryCapFactor * 1200) {
					localTvRevenue = salaryCapFactor * 1200;
				}
			} else {
				// Football targets:
				// expenses: $350M
				// national TV: $170M
				// local TV: $50M
				// ticket: $75M
				// sponsorship: $25M
				// merchandise: $25M
				nationalTvRevenue = (salaryCapFactor2 * 175000) / g.get("numGames");
				localTvRevenue =
					(salaryCapFactor2 * ((5000 / g.get("numGames")) * baseAttendance)) /
					g.get("defaultStadiumCapacity");
				sponsorRevenue =
					(salaryCapFactor2 * ((2500 / g.get("numGames")) * baseAttendance)) /
					g.get("defaultStadiumCapacity");
				merchRevenue =
					(salaryCapFactor2 * ((2500 / g.get("numGames")) * baseAttendance)) /
					g.get("defaultStadiumCapacity");
			}
		}

		// Attendance: base on home team
		if (t1 === 0) {
			attendance = await getActualAttendance({
				baseAttendance,
				randomize: true,
				stadiumCapacity: teamSeason.stadiumCapacity,
				teamSeasons,
				tid: teamSeason.tid,
				adjustedTicketPrice,
			});
		}

		// This doesn't really make sense
		let ticketRevenue = (adjustedTicketPrice * attendance) / 1000; // [thousands of dollars]

		// Hype - relative to the expectations of prior seasons
		const gp = helpers.getTeamSeasonGp(teamSeason);
		if (gp > 5 && g.get("phase") !== PHASE.PLAYOFFS) {
			let winp = helpers.calcWinp(teamSeason);
			let winpOld = 0; // Avg winning percentage of last 0-2 seasons (as available)

			for (let i = 0; i < teamSeasons.length - 1; i++) {
				winpOld += helpers.calcWinp(teamSeasons[i]);
			}

			if (teamSeasons.length > 1) {
				winpOld /= teamSeasons.length - 1;
			} else {
				winpOld = 0.5; // Default for new games
			}

			// It should never happen, but winp and winpOld sometimes turn up as NaN due to a duplicate season entry or the user skipping seasons
			if (Number.isNaN(winp)) {
				winp = 0;
			}

			if (Number.isNaN(winpOld)) {
				winpOld = 0;
			}

			teamSeason.hype =
				teamSeason.hype + 0.01 * (winp - 0.55) + 0.015 * (winp - winpOld);

			if (teamSeason.hype > 1) {
				teamSeason.hype = 1;
			} else if (teamSeason.hype < 0) {
				teamSeason.hype = 0;
			}
		}

		// 5% bonus for easy, 5% penalty for hard, 20% penalty for insane
		const fudgeFactor = g.get("userTids").includes(results.team[t1].id)
			? helpers.bound(1 - 0.2 * g.get("difficulty"), 0, Infinity)
			: 1;

		// Globally adjust revenue based on the number of games in the season and playoffs

		let seasonLengthFactor;
		if (g.get("phase") === PHASE.PLAYOFFS) {
			let numGamesCurrent = 0;
			for (const numGames of g.get("numGamesPlayoffSeries")) {
				numGamesCurrent += Math.ceil((numGames * 3) / 4);
			}
			let numGamesDefault = 0;
			// defaultGameAttributes.numGamesPlayoffSeries, but frozen in time because otherwise various coefficients below would need to be updated when it changes
			for (const numGames of bySport({
				baseball: [3, 5, 7, 7],
				basketball: [7, 7, 7, 7],
				football: [1, 1, 1, 1],
				hockey: [7, 7, 7, 7],
			})) {
				numGamesDefault += Math.ceil((numGames * 3) / 4);
			}
			seasonLengthFactor = numGamesDefault / numGamesCurrent;
		} else {
			// defaultGameAttributes.numGames, but frozen in time because otherwise various coefficients below would need to be updated when it changes
			seasonLengthFactor =
				bySport({
					baseball: 162,
					basketball: 82,
					football: 17,
					hockey: 82,
				}) / g.get("numGames");
		}

		merchRevenue *= fudgeFactor * seasonLengthFactor;
		sponsorRevenue *= fudgeFactor * seasonLengthFactor;
		nationalTvRevenue *= fudgeFactor * seasonLengthFactor;
		localTvRevenue *= fudgeFactor * seasonLengthFactor;
		ticketRevenue *= fudgeFactor * seasonLengthFactor;
		const revenue =
			merchRevenue +
			sponsorRevenue +
			nationalTvRevenue +
			localTvRevenue +
			ticketRevenue;
		const expenses =
			salaryPaid + scoutingPaid + coachingPaid + healthPaid + facilitiesPaid;
		teamSeason.cash += revenue - expenses;

		if (t1 === 0) {
			// Only home team gets attendance...
			teamSeason.att += attendance; // This is only used for attendance tracking

			// See also team.js and teamFinances.js
			teamSeason.gpHome += 1;
		}

		teamSeason.revenues.merch += merchRevenue;
		teamSeason.revenues.sponsor += sponsorRevenue;
		teamSeason.revenues.nationalTv += nationalTvRevenue;
		teamSeason.revenues.localTv += localTvRevenue;
		teamSeason.revenues.ticket += ticketRevenue;

		// Non-zero expenses only in playoffs
		if (g.get("phase") !== PHASE.PLAYOFFS) {
			teamSeason.expenses.salary += salaryPaid;
			teamSeason.expenses.scouting += scoutingPaid;
			teamSeason.expenses.coaching += coachingPaid;
			teamSeason.expenses.health += healthPaid;
			teamSeason.expenses.facilities += facilitiesPaid;

			teamSeason.expenseLevels.scouting += t.budget.scouting;
			teamSeason.expenseLevels.coaching += t.budget.coaching;
			teamSeason.expenseLevels.health += t.budget.health;
			teamSeason.expenseLevels.facilities += t.budget.facilities;
		}

		// For historical reasons, "ba" is special in basketball (stored in box score, not in team stats)
		const skip = bySport({
			baseball: ["ptsQtrs", "gp"],
			basketball: ["ptsQtrs", "ba"],
			football: ["ptsQtrs"],
			hockey: ["ptsQtrs"],
		});

		for (const key of Object.keys(results.team[t1].stat)) {
			if (skip.includes(key)) {
				continue;
			}

			if (teamStats[key] === undefined) {
				teamStats[key] = 0;
			}

			if (isSport("football") && key.endsWith("Lng")) {
				if (results.team[t1].stat[key] > teamStats[key]) {
					teamStats[key] = results.team[t1].stat[key];
				}
			} else if (team.stats.byPos && team.stats.byPos.includes(key)) {
				for (let i = 0; i < results.team[t1].stat[key].length; i++) {
					const value = results.team[t1].stat[key][i];
					if (value !== undefined) {
						if (teamStats[key][i] === undefined) {
							teamStats[key][i] = 0;
						}
						teamStats[key][i] += value;
					}
				}
			} else {
				teamStats[key] += results.team[t1].stat[key];
			}

			if (key !== "min") {
				const oppKey = `opp${helpers.upperCaseFirstLetter(key)}`;

				// Deal with upgraded leagues, and some stats that don't have opp versions
				if (teamStats[oppKey] !== undefined) {
					if (team.stats.byPos && team.stats.byPos.includes(oppKey)) {
						for (let i = 0; i < results.team[t2].stat[key].length; i++) {
							const value = results.team[t2].stat[key][i];
							if (value !== undefined) {
								if (teamStats[oppKey][i] === undefined) {
									teamStats[oppKey][i] = 0;
								}
								teamStats[oppKey][i] += value;
							}
						}
					} else {
						teamStats[oppKey] += results.team[t2].stat[key];
					}
				}
			}
		}

		// Track this separately, because a team can get a shutout with multiple goalies, and then there is no player shutout
		if (isSport("hockey")) {
			if (results.team[t2].stat.pts === 0) {
				teamStats.so += 1;
			}
			if (results.team[t1].stat.pts === 0) {
				teamStats.oppSo += 1;
			}
		}

		teamStats.gp += 1;

		if (teamSeason.lastTen.length === 10 && g.get("phase") !== PHASE.PLAYOFFS) {
			teamSeason.lastTen.pop();
		}

		if (won && g.get("phase") !== PHASE.PLAYOFFS) {
			teamSeason.won += 1;

			if (results.team[0].did === results.team[1].did) {
				teamSeason.wonDiv += 1;
			}

			if (results.team[0].cid === results.team[1].cid) {
				teamSeason.wonConf += 1;
			}

			if (t1 === 0) {
				teamSeason.wonHome += 1;
			} else {
				teamSeason.wonAway += 1;
			}

			teamSeason.lastTen.unshift(1);

			if (teamSeason.streak >= 0) {
				teamSeason.streak += 1;
			} else {
				teamSeason.streak = 1;
			}
		} else if (lost && g.get("phase") !== PHASE.PLAYOFFS) {
			const lostOrOtl =
				results.overtimes > 0 && g.get("otl", "current") ? "otl" : "lost";

			teamSeason[lostOrOtl] += 1;

			if (results.team[0].did === results.team[1].did) {
				teamSeason[`${lostOrOtl}Div` as const] += 1;
			}

			if (results.team[0].cid === results.team[1].cid) {
				teamSeason[`${lostOrOtl}Conf` as const] += 1;
			}

			if (t1 === 0) {
				teamSeason[`${lostOrOtl}Home` as const] += 1;
			} else {
				teamSeason[`${lostOrOtl}Away` as const] += 1;
			}

			if (lostOrOtl === "lost") {
				teamSeason.lastTen.unshift(0);
			} else {
				teamSeason.lastTen.unshift("OTL");
			}

			if (teamSeason.streak <= 0) {
				teamSeason.streak -= 1;
			} else {
				teamSeason.streak = -1;
			}
		} else if (g.get("ties", "current") && g.get("phase") !== PHASE.PLAYOFFS) {
			teamSeason.tied += 1;

			if (results.team[0].did === results.team[1].did) {
				teamSeason.tiedDiv += 1;
			}

			if (results.team[0].cid === results.team[1].cid) {
				teamSeason.tiedConf += 1;
			}

			if (t1 === 0) {
				teamSeason.tiedHome += 1;
			} else {
				teamSeason.tiedAway += 1;
			}

			teamSeason.lastTen.unshift(-1);
			teamSeason.streak = 0;
		}

		if (teamSeason.ovrStart === undefined) {
			const playersRaw = await idb.cache.players.indexGetAll(
				"playersByTid",
				teamSeason.tid,
			);
			const players = await idb.getCopies.playersPlus(playersRaw, {
				attrs: ["pid", "value"],
				fuzz: true,
				ratings: ["ovr", "pos", "ovrs"],
				season: g.get("season"),
				tid: teamSeason.tid,
			});
			teamSeason.ovrStart = team.ovr(players);
		}

		await idb.cache.teams.put(t);
		await idb.cache.teamSeasons.put(teamSeason);
		await idb.cache.teamStats.put(teamStats);
	}

	return attendance;
};

export default writeTeamStats;
