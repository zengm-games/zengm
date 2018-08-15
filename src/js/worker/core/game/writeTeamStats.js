// @flow

import { PHASE } from "../../../common";
import { finances, team } from "..";
import { idb } from "../../db";
import { g, helpers, random } from "../../util";
import type { GameResults } from "../../../common/types";

const writeTeamStats = async (results: GameResults) => {
    let att = 0;
    let ticketPrice = 0;

    for (const t1 of [0, 1]) {
        const t2 = t1 === 1 ? 0 : 1;

        const payroll = await team.getPayroll(results.team[t1].id);
        const [t, teamSeasons, teamStats] = await Promise.all([
            idb.cache.teams.get(results.team[t1].id),
            idb.cache.teamSeasons.indexGetAll("teamSeasonsByTidSeason", [
                [results.team[t1].id, g.season - 2],
                [results.team[t1].id, g.season],
            ]),
            idb.cache.teamStats.indexGet("teamStatsByPlayoffsTid", [
                g.phase === PHASE.PLAYOFFS,
                results.team[t1].id,
            ]),
        ]);

        const teamSeason = teamSeasons[teamSeasons.length - 1];
        const won = results.team[t1].stat.pts > results.team[t2].stat.pts;

        // Attendance - base calculation now, which is used for other revenue estimates
        if (t1 === 0) {
            // Base on home team
            att =
                10000 +
                (0.1 + 0.9 * teamSeason.hype ** 2) *
                    teamSeason.pop *
                    1000000 *
                    0.01; // Base attendance - between 2% and 0.2% of the region
            if (g.phase === PHASE.PLAYOFFS) {
                att *= 1.5; // Playoff bonus
            }
            ticketPrice = t.budget.ticketPrice.amount;
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
        if (g.phase !== PHASE.PLAYOFFS) {
            // All in [thousands of dollars]
            salaryPaid = payroll / g.numGames;
            scoutingPaid = t.budget.scouting.amount / g.numGames;
            coachingPaid = t.budget.coaching.amount / g.numGames;
            healthPaid = t.budget.health.amount / g.numGames;
            facilitiesPaid = t.budget.facilities.amount / g.numGames;
            merchRevenue = ((g.salaryCap / 90000) * 4.5 * att) / 1000;
            if (merchRevenue > 250) {
                merchRevenue = 250;
            }
            sponsorRevenue = ((g.salaryCap / 90000) * 15 * att) / 1000;
            if (sponsorRevenue > 600) {
                sponsorRevenue = 600;
            }
            nationalTvRevenue = (g.salaryCap / 90000) * 375;
            localTvRevenue = ((g.salaryCap / 90000) * 15 * att) / 1000;
            if (localTvRevenue > 1200) {
                localTvRevenue = 1200;
            }
        }

        // Attendance - final estimate
        if (t1 === 0) {
            // Base on home team
            att = random.gauss(att, 1000);
            att *= 45 / ((g.salaryCap / 90000) * ticketPrice); // Attendance depends on ticket price. Not sure if this formula is reasonable.
            att *=
                1 +
                (0.075 *
                    (g.numTeams -
                        finances.getRankLastThree(
                            teamSeasons,
                            "expenses",
                            "facilities",
                        ))) /
                    (g.numTeams - 1); // Attendance depends on facilities. Not sure if this formula is reasonable.
            if (att > teamSeason.stadiumCapacity) {
                att = teamSeason.stadiumCapacity;
            } else if (att < 0) {
                att = 0;
            }
            att = Math.round(att);
        }
        // This doesn't really make sense
        let ticketRevenue = (ticketPrice * att) / 1000; // [thousands of dollars]

        // Hype - relative to the expectations of prior seasons
        if (teamSeason.gp > 5 && g.phase !== PHASE.PLAYOFFS) {
            let winp = teamSeason.won / (teamSeason.won + teamSeason.lost);
            let winpOld = 0;

            // Avg winning percentage of last 0-2 seasons (as available)
            for (let i = 0; i < teamSeasons.length - 1; i++) {
                winpOld +=
                    teamSeasons[i].won /
                    (teamSeasons[i].won + teamSeasons[i].lost);
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
                teamSeason.hype +
                0.01 * (winp - 0.55) +
                0.015 * (winp - winpOld);
            if (teamSeason.hype > 1) {
                teamSeason.hype = 1;
            } else if (teamSeason.hype < 0) {
                teamSeason.hype = 0;
            }
        }

        // 5% bonus for easy, 5% penalty for hard, 20% penalty for insane
        const fudgeFactor = g.userTids.includes(results.team[t1].id)
            ? helpers.bound(1 - 0.2 * g.difficulty, 0, Infinity)
            : 1;
        merchRevenue *= fudgeFactor;
        sponsorRevenue *= fudgeFactor;
        nationalTvRevenue *= fudgeFactor;
        localTvRevenue *= fudgeFactor;
        ticketRevenue *= fudgeFactor;

        const revenue =
            merchRevenue +
            sponsorRevenue +
            nationalTvRevenue +
            localTvRevenue +
            ticketRevenue;
        const expenses =
            salaryPaid +
            scoutingPaid +
            coachingPaid +
            healthPaid +
            facilitiesPaid;

        teamSeason.cash += revenue - expenses;
        if (t1 === 0) {
            // Only home team gets attendance...
            teamSeason.att += att;

            // This is only used for attendance tracking
            if (!teamSeason.hasOwnProperty("gpHome")) {
                teamSeason.gpHome = Math.round(teamSeason.gp / 2);
            } // See also team.js and teamFinances.js
            teamSeason.gpHome += 1;
        }
        teamSeason.gp += 1;
        teamSeason.revenues.merch.amount += merchRevenue;
        teamSeason.revenues.sponsor.amount += sponsorRevenue;
        teamSeason.revenues.nationalTv.amount += nationalTvRevenue;
        teamSeason.revenues.localTv.amount += localTvRevenue;
        teamSeason.revenues.ticket.amount += ticketRevenue;
        teamSeason.expenses.salary.amount += salaryPaid;
        teamSeason.expenses.scouting.amount += scoutingPaid;
        teamSeason.expenses.coaching.amount += coachingPaid;
        teamSeason.expenses.health.amount += healthPaid;
        teamSeason.expenses.facilities.amount += facilitiesPaid;

        const keys = [
            "min",
            "fg",
            "fga",
            "fgAtRim",
            "fgaAtRim",
            "fgLowPost",
            "fgaLowPost",
            "fgMidRange",
            "fgaMidRange",
            "tp",
            "tpa",
            "ft",
            "fta",
            "orb",
            "drb",
            "ast",
            "tov",
            "stl",
            "blk",
            "pf",
            "pts",
        ];
        for (const key of keys) {
            teamStats[key] += results.team[t1].stat[key];

            if (key !== "min") {
                const oppKey = `opp${key[0].toUpperCase()}${key.slice(1)}`;

                // Deal with upgraded leagues
                if (teamStats.hasOwnProperty(oppKey)) {
                    teamStats[oppKey] += results.team[t2].stat[key];
                }
            }
        }
        teamStats.gp += 1;

        if (teamSeason.lastTen.length === 10 && g.phase !== PHASE.PLAYOFFS) {
            teamSeason.lastTen.pop();
        }

        if (won && g.phase !== PHASE.PLAYOFFS) {
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
        } else if (g.phase !== PHASE.PLAYOFFS) {
            teamSeason.lost += 1;
            if (results.team[0].did === results.team[1].did) {
                teamSeason.lostDiv += 1;
            }
            if (results.team[0].cid === results.team[1].cid) {
                teamSeason.lostConf += 1;
            }

            if (t1 === 0) {
                teamSeason.lostHome += 1;
            } else {
                teamSeason.lostAway += 1;
            }

            teamSeason.lastTen.unshift(0);

            if (teamSeason.streak <= 0) {
                teamSeason.streak -= 1;
            } else {
                teamSeason.streak = -1;
            }
        }

        await idb.cache.teams.put(t);
        await idb.cache.teamSeasons.put(teamSeason);
        await idb.cache.teamStats.put(teamStats);
    }

    return att;
};

export default writeTeamStats;
