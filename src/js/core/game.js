import backboard from 'backboard';
import Promise from 'bluebird';
import _ from 'underscore';
import g from '../globals';
import * as ui from '../ui';
import GameSim from './GameSim';
import * as finances from './finances';
import * as freeAgents from './freeAgents';
import * as league from './league';
import * as phase from './phase';
import * as player from './player';
import * as season from './season';
import * as team from './team';
import * as advStats from '../util/advStats';
import logEvent from '../util/logEvent';
import * as helpers from '../util/helpers';
import * as lock from '../util/lock';
import * as random from '../util/random';

function writeTeamStats(tx, results) {
    return Promise.reduce([0, 1], async (cache, t1) => {
        const t2 = t1 === 1 ? 0 : 1;

        const [payroll, t, teamSeasons, teamStatsArray] = await Promise.all([
            team.getPayroll(tx, results.team[t1].id).get(0),
            tx.teams.get(results.team[t1].id),
            tx.teamSeasons.index("tid, season").getAll(backboard.bound([results.team[t1].id, g.season - 2], [results.team[t1].id, g.season])),
            tx.teamStats.index("season, tid").getAll([g.season, results.team[t1].id]),
        ]);

        const teamSeason = teamSeasons[teamSeasons.length - 1];
        const teamStats = teamStatsArray.find(ts => ts.playoffs === (g.phase === g.PHASE.PLAYOFFS));
        const won = results.team[t1].stat.pts > results.team[t2].stat.pts;

        // Attendance - base calculation now, which is used for other revenue estimates
        let att = cache.att;
        let ticketPrice = cache.ticketPrice;
        if (t1 === 0) { // Base on home team
            att = 10000 + (0.1 + 0.9 * Math.pow(teamSeason.hype, 2)) * teamSeason.pop * 1000000 * 0.01;  // Base attendance - between 2% and 0.2% of the region
            if (g.phase === g.PHASE.PLAYOFFS) {
                att *= 1.5;  // Playoff bonus
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
        if (g.phase !== g.PHASE.PLAYOFFS) {
            // All in [thousands of dollars]
            salaryPaid = payroll / g.numGames;
            scoutingPaid = t.budget.scouting.amount / g.numGames;
            coachingPaid = t.budget.coaching.amount / g.numGames;
            healthPaid = t.budget.health.amount / g.numGames;
            facilitiesPaid = t.budget.facilities.amount / g.numGames;
            merchRevenue = (g.salaryCap / 90000) * 4.5 * att / 1000;
            if (merchRevenue > 250) {
                merchRevenue = 250;
            }
            sponsorRevenue = (g.salaryCap / 90000) * 15 * att / 1000;
            if (sponsorRevenue > 600) {
                sponsorRevenue = 600;
            }
            nationalTvRevenue = (g.salaryCap / 90000) * 375;
            localTvRevenue = (g.salaryCap / 90000) * 15 * att / 1000;
            if (localTvRevenue > 1200) {
                localTvRevenue = 1200;
            }
        }

        // Attendance - final estimate
        if (t1 === 0) { // Base on home team
            att = random.gauss(att, 1000);
            att *= 45 / ((g.salaryCap / 90000) * ticketPrice);  // Attendance depends on ticket price. Not sure if this formula is reasonable.
            att *= 1 + 0.075 * (g.numTeams - finances.getRankLastThree(teamSeasons, "expenses", "facilities")) / (g.numTeams - 1);  // Attendance depends on facilities. Not sure if this formula is reasonable.
            if (att > 25000) {
                att = 25000;
            } else if (att < 0) {
                att = 0;
            }
            att = Math.round(att);
        }
        // This doesn't really make sense
        const ticketRevenue = ticketPrice * att / 1000;  // [thousands of dollars]

        // Hype - relative to the expectations of prior seasons
        if (teamSeason.gp > 5 && g.phase !== g.PHASE.PLAYOFFS) {
            let winp = teamSeason.won / (teamSeason.won + teamSeason.lost);
            let winpOld = 0;

            // Avg winning percentage of last 0-2 seasons (as available)
            for (let i = 0; i < teamSeasons.length - 1; i++) {
                winpOld += teamSeasons[i].won / (teamSeasons[i].won + teamSeasons[i].lost);
            }
            if (teamSeasons.length > 1) {
                winpOld /= teamSeasons.length - 1;
            } else {
                winpOld = 0.5; // Default for new games
            }

            // It should never happen, but winp and winpOld sometimes turn up as NaN due to a duplicate season entry or the user skipping seasons
            if (isNaN(winp)) {
                winp = 0;
            }
            if (isNaN(winpOld)) {
                winpOld = 0;
            }

            teamSeason.hype = teamSeason.hype + 0.01 * (winp - 0.55) + 0.015 * (winp - winpOld);
            if (teamSeason.hype > 1) {
                teamSeason.hype = 1;
            } else if (teamSeason.hype < 0) {
                teamSeason.hype = 0;
            }
        }

        const revenue = merchRevenue + sponsorRevenue + nationalTvRevenue + localTvRevenue + ticketRevenue;
        const expenses = salaryPaid + scoutingPaid + coachingPaid + healthPaid + facilitiesPaid;
        teamSeason.cash += revenue - expenses;
        if (t1 === 0) {
            // Only home team gets attendance...
            teamSeason.att += att;

            // This is only used for attendance tracking
            if (!teamSeason.hasOwnProperty("gpHome")) { teamSeason.gpHome = Math.round(teamSeason.gp / 2); } // See also team.js and teamFinances.js
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

        const keys = ['min', 'fg', 'fga', 'fgAtRim', 'fgaAtRim', 'fgLowPost', 'fgaLowPost', 'fgMidRange', 'fgaMidRange', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'pf', 'pts'];
        for (let i = 0; i < keys.length; i++) {
            teamStats[keys[i]] += results.team[t1].stat[keys[i]];
        }
        teamStats.gp += 1;
        teamStats.trb += results.team[t1].stat.orb + results.team[t1].stat.drb;
        teamStats.oppPts += results.team[t2].stat.pts;
        teamStats.ba += results.team[t2].stat.blk;

        if (teamSeason.lastTen.length === 10 && g.phase !== g.PHASE.PLAYOFFS) {
            teamSeason.lastTen.pop();
        }

        if (won && g.phase !== g.PHASE.PLAYOFFS) {
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
        } else if (g.phase !== g.PHASE.PLAYOFFS) {
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

        await Promise.all([
            tx.teams.put(t),
            tx.teamSeasons.put(teamSeason),
            tx.teamStats.put(teamStats),
        ]);

        return {
            att,
            ticketPrice,
        };
    }, 0);
}

function writePlayerStats(tx, results) {
    return Promise.map(results.team, t => Promise.map(t.player, p => {
        // Only need to write stats if player got minutes
        if (p.stat.min === 0) {
            return;
        }

        const promises = [];

        promises.push(player.checkStatisticalFeat(tx, p.id, t.id, p, results));

        promises.push(tx.playerStats.index("pid, season, tid")
            // prev in case there are multiple entries for the same player, like he was traded away and then brought back
            .iterate([p.id, g.season, t.id], "prev", async (ps, shortCircuit) => {
                // Since index is not on playoffs, manually check
                if (ps.playoffs !== (g.phase === g.PHASE.PLAYOFFS)) {
                    return;
                }

                // Found it!
                shortCircuit();

                // Update stats
                const keys = ['gs', 'min', 'fg', 'fga', 'fgAtRim', 'fgaAtRim', 'fgLowPost', 'fgaLowPost', 'fgMidRange', 'fgaMidRange', 'tp', 'tpa', 'ft', 'fta', 'pm', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'ba', 'pf', 'pts'];
                for (let i = 0; i < keys.length; i++) {
                    ps[keys[i]] += p.stat[keys[i]];
                }
                ps.gp += 1; // Already checked for non-zero minutes played above
                ps.trb += p.stat.orb + p.stat.drb;

                const injuredThisGame = p.injured && p.injury.type === "Healthy";

                // Only update player object (values and injuries) every 10 regular season games or on injury
                if ((ps.gp % 10 === 0 && g.phase !== g.PHASE.PLAYOFFS) || injuredThisGame) {
                    const p2 = await tx.players.get(p.id);

                    // Injury crap - assign injury type if player does not already have an injury in the database
                    let biggestRatingsLoss;
                    if (injuredThisGame) {
                        p2.injury = player.injury(t.healthRank);
                        p.injury = p2.injury; // So it gets written to box score
                        logEvent(tx, {
                            type: "injured",
                            text: `<a href="${helpers.leagueUrl(["player", p2.pid])}">${p2.firstName} ${p2.lastName}</a> was injured! (${p2.injury.type}, out for ${p2.injury.gamesRemaining} games)`,
                            showNotification: p2.tid === g.userTid,
                            pids: [p2.pid],
                            tids: [p2.tid],
                        });

                        // Some chance of a loss of athleticism from serious injuries
                        // 100 game injury: 67% chance of losing between 0 and 10 of spd, jmp, endu
                        // 50 game injury: 33% chance of losing between 0 and 5 of spd, jmp, endu
                        if (p2.injury.gamesRemaining > 25 && Math.random() < p2.injury.gamesRemaining / 150) {
                            biggestRatingsLoss = Math.round(p2.injury.gamesRemaining / 10);
                            if (biggestRatingsLoss > 10) {
                                biggestRatingsLoss = 10;
                            }

                            // Small chance of horrible things
                            if (biggestRatingsLoss === 10 && Math.random() < 0.01) {
                                biggestRatingsLoss = 30;
                            }

                            const r = p2.ratings.length - 1;
                            p2.ratings[r].spd = helpers.bound(p2.ratings[r].spd - random.randInt(0, biggestRatingsLoss), 0, 100);
                            p2.ratings[r].jmp = helpers.bound(p2.ratings[r].jmp - random.randInt(0, biggestRatingsLoss), 0, 100);
                            p2.ratings[r].endu = helpers.bound(p2.ratings[r].endu - random.randInt(0, biggestRatingsLoss), 0, 100);
                        }
                    }

                    // Player value depends on ratings and regular season stats, neither of which can change in the playoffs (except for severe injuries)
                    if (g.phase !== g.PHASE.PLAYOFFS) {
                        await player.updateValues(tx, p2, [ps]);
                    }
                    if (biggestRatingsLoss) {
                        await player.updateValues(tx, p2, []);
                    }

                    await tx.players.put(p2);
                }

                return ps;
            }));

        return Promise.all(promises);
    }));
}

async function writeGameStats(tx, results, att) {
    const gameStats = {
        gid: results.gid,
        att,
        season: g.season,
        playoffs: g.phase === g.PHASE.PLAYOFFS,
        overtimes: results.overtimes,
        won: {},
        lost: {},
        teams: [
            {tid: results.team[0].id, players: []},
            {tid: results.team[1].id, players: []},
        ],
    };

    for (let t = 0; t < 2; t++) {
        const keys = ['min', 'fg', 'fga', 'fgAtRim', 'fgaAtRim', 'fgLowPost', 'fgaLowPost', 'fgMidRange', 'fgaMidRange', 'tp', 'tpa', 'ft', 'fta', 'orb', 'drb', 'ast', 'tov', 'stl', 'blk', 'ba', 'pf', 'pts', 'ptsQtrs'];
        for (let i = 0; i < keys.length; i++) {
            gameStats.teams[t][keys[i]] = results.team[t].stat[keys[i]];
        }
        gameStats.teams[t].trb = results.team[t].stat.orb + results.team[t].stat.drb;

        keys.unshift("gs"); // Also record starters, in addition to other stats
        keys.push("pm");
        for (let p = 0; p < results.team[t].player.length; p++) {
            gameStats.teams[t].players[p] = {name: results.team[t].player[p].name, pos: results.team[t].player[p].pos};
            for (let i = 0; i < keys.length; i++) {
                gameStats.teams[t].players[p][keys[i]] = results.team[t].player[p].stat[keys[i]];
            }
            gameStats.teams[t].players[p].trb = results.team[t].player[p].stat.orb + results.team[t].player[p].stat.drb;
            gameStats.teams[t].players[p].pid = results.team[t].player[p].id;
            gameStats.teams[t].players[p].skills = results.team[t].player[p].skills;
            gameStats.teams[t].players[p].injury = results.team[t].player[p].injury;
        }
    }

    // Store some extra junk to make box scores easy
    const [tw, tl] = results.team[0].stat.pts > results.team[1].stat.pts ? [0, 1] : [1, 0];

    gameStats.won.tid = results.team[tw].id;
    gameStats.lost.tid = results.team[tl].id;
    gameStats.won.pts = results.team[tw].stat.pts;
    gameStats.lost.pts = results.team[tl].stat.pts;

    // Event log
    if (results.team[0].id === g.userTid || results.team[1].id === g.userTid) {
        let text;
        if (results.team[tw].id === g.userTid) {
            text = `Your team defeated the <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[results.team[tl].id], g.season])}">${g.teamNamesCache[results.team[tl].id]}`;
        } else {
            text = `Your team lost to the <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[results.team[tw].id], g.season])}">${g.teamNamesCache[results.team[tw].id]}`;
        }
        text += `</a> <a href="${helpers.leagueUrl(["game_log", g.teamAbbrevsCache[g.userTid], g.season, results.gid])}">${results.team[tw].stat.pts}-${results.team[tl].stat.pts}</a>.`;
        logEvent(tx, {
            type: results.team[tw].id === g.userTid ? "gameWon" : "gameLost",
            text,
            saveToDb: false,
            tids: [results.team[0].id, results.team[1].id],
        });
    }

    if (results.clutchPlays.length > 0) {
        for (let i = 0; i < results.clutchPlays.length; i++) {
            if (results.clutchPlays[i].hasOwnProperty("tempText")) {
                results.clutchPlays[i].text = results.clutchPlays[i].tempText;
                if (results.clutchPlays[i].tids[0] === results.team[tw].id) {
                    results.clutchPlays[i].text += ` in ${results.team[tw].stat.pts.toString().charAt(0) === '8' ? 'an' : 'a'} <a href="${helpers.leagueUrl(["game_log", g.teamAbbrevsCache[results.team[tw].id], g.season, results.gid])}">${results.team[tw].stat.pts}-${results.team[tl].stat.pts}</a> win over the ${g.teamNamesCache[results.team[tl].id]}.`;
                } else {
                    results.clutchPlays[i].text += ` in ${results.team[tl].stat.pts.toString().charAt(0) === '8' ? 'an' : 'a'} <a href="${helpers.leagueUrl(["game_log", g.teamAbbrevsCache[results.team[tl].id], g.season, results.gid])}">${results.team[tl].stat.pts}-${results.team[tw].stat.pts}</a> loss to the ${g.teamNamesCache[results.team[tw].id]}.`;
                }
                delete results.clutchPlays[i].tempText;
            }
            logEvent(tx, results.clutchPlays[i]);
        }
    }

    await tx.games.put(gameStats);
}

async function updatePlayoffSeries(tx, results) {
    const playoffSeries = await tx.playoffSeries.get(g.season);

    const playoffRound = playoffSeries.series[playoffSeries.currentRound];

    for (const result of results) {
        // Did the home (true) or away (false) team win this game? Here, "home" refers to this game, not the team which has homecourt advnatage in the playoffs, which is what series.home refers to below.
        const won0 = result.team[0].stat.pts > result.team[1].stat.pts;

        let series;
        for (let i = 0; i < playoffRound.length; i++) {
            series = playoffRound[i];

            if (series.home.tid === result.team[0].id) {
                if (won0) {
                    series.home.won += 1;
                } else {
                    series.away.won += 1;
                }
                break;
            } else if (series.away.tid === result.team[0].id) {
                if (won0) {
                    series.away.won += 1;
                } else {
                    series.home.won += 1;
                }
                break;
            }
        }

        // Log result of playoff series
        if (series.away.won >= 4 || series.home.won >= 4) {
            let winnerTid;
            let loserTid;
            let loserWon;
            if (series.away.won >= 4) {
                winnerTid = series.away.tid;
                loserTid = series.home.tid;
                loserWon = series.home.won;
            } else {
                winnerTid = series.home.tid;
                loserTid = series.away.tid;
                loserWon = series.away.won;
            }

            let currentRoundText;
            if (playoffSeries.currentRound === 0) {
                currentRoundText = "first round of the playoffs";
            } else if (playoffSeries.currentRound === 1) {
                currentRoundText = "second round of the playoffs";
            } else if (playoffSeries.currentRound === 2) {
                currentRoundText = "conference finals";
            } else if (playoffSeries.currentRound === 3) {
                currentRoundText = "league championship";
            }

            const showNotification = series.away.tid === g.userTid || series.home.tid === g.userTid || playoffSeries.currentRound === 3;
            logEvent(tx, {
                type: "playoffs",
                text: `The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[winnerTid], g.season])}">${g.teamNamesCache[winnerTid]}</a> defeated the <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[loserTid], g.season])}">${g.teamNamesCache[loserTid]}</a> in the ${currentRoundText}, 4-${loserWon}.`,
                showNotification,
                tids: [winnerTid, loserTid],
            });
        }
    }

    await tx.playoffSeries.put(playoffSeries);
}

/**
 * Build a composite rating.
 *
 * Composite ratings are combinations of player ratings meant to represent one facet of the game, like the ability to make a jump shot. All composite ratings are scaled from 0 to 1.
 *
 * @memberOf core.game
 * @param {Object.<string, number>} ratings Player's ratings object.
 * @param {Array.<string>} components List of player ratings to include in the composite ratings. In addition to the normal ones, "constant" is a constant value of 50 for every player, which can be used to add a baseline value for a stat.
 * @param {Array.<number>=} weights Optional array of weights used in the linear combination of components. If undefined, then all weights are assumed to be 1. If defined, this must be the same size as components.
 * @return {number} Composite rating, a number between 0 and 1.
 */
function makeComposite(rating, components, weights) {
    if (weights === undefined) {
        // Default: array of ones with same size as components
        weights = [];
        for (let i = 0; i < components.length; i++) {
            weights.push(1);
        }
    }

    rating.constant = 50;

    let r = 0;
    let divideBy = 0;
    for (let i = 0; i < components.length; i++) {
        // Sigmoidal transformation
        //y = (rating[component] - 70) / 10;
        //rcomp = y / Math.sqrt(1 + Math.pow(y, 2));
        //rcomp = (rcomp + 1) * 50;
        const rcomp = weights[i] * rating[components[i]];

        r += rcomp;

        divideBy += 100 * weights[i];
    }

    r /= divideBy;  // Scale from 0 to 1
    if (r > 1) {
        r = 1;
    } else if (r < 0) {
        r = 0;
    }

    return r;
}

/**
 * Load all teams into an array of team objects.
 *
 * The team objects contain all the information needed to simulate games. It would be more efficient if it only loaded team data for teams that are actually playing, particularly in the playoffs.
 *
 * @memberOf core.game
 * @param {IDBTransaction} ot An IndexedDB transaction on players and teams.
 * @param {Promise} Resolves to an array of team objects, ordered by tid.
 */
async function loadTeams(tx) {
    return Promise.map(_.range(g.numTeams), async tid => {
        const [players, {cid, did}, teamSeason] = await Promise.all([
            tx.players.index('tid').getAll(tid),
            tx.teams.get(tid),
            tx.teamSeasons.index("season, tid").get([g.season, tid]),
        ]);

        players.sort((a, b) => a.rosterOrder - b.rosterOrder);

        const t = {id: tid, defense: 0, pace: 0, won: 0, lost: 0, cid: 0, did: 0, stat: {}, player: [], synergy: {off: 0, def: 0, reb: 0}};

        t.won = teamSeason.won;
        t.lost = teamSeason.lost;
        t.cid = cid;
        t.did = did;
        t.healthRank = teamSeason.expenses.health.rank;

        for (let i = 0; i < players.length; i++) {
            const pos = players[i].ratings[players[i].ratings.length - 1].pos;
            const p = {id: players[i].pid, name: `${players[i].firstName} ${players[i].lastName}`, pos, valueNoPot: players[i].valueNoPot, stat: {}, compositeRating: {}, skills: [], injury: players[i].injury, injured: players[i].injury.type !== "Healthy", ptModifier: players[i].ptModifier};

            // Reset ptModifier for AI teams. This should not be necessary since it should always be 1, but let's be safe.
            if (!g.userTids.includes(t.id)) {
                p.ptModifier = 1;
            }

            const rating = players[i].ratings.find(r => r.season === g.season);
            if (rating === undefined) {
                throw new Error(`Player with no ratings for this season: ${players[i].firstName} ${players[i].lastName} (ID: ${players[i].pid})`);
            }

            p.skills = rating.skills;

            p.ovr = rating.ovr;

            // These use the same formulas as the skill definitions in player.skills!
            for (const k of Object.keys(g.compositeWeights)) {
                p.compositeRating[k] = makeComposite(rating, g.compositeWeights[k].ratings, g.compositeWeights[k].weights);
            }
            p.compositeRating.usage = Math.pow(p.compositeRating.usage, 1.9);

            p.stat = {gs: 0, min: 0, fg: 0, fga: 0, fgAtRim: 0, fgaAtRim: 0, fgLowPost: 0, fgaLowPost: 0, fgMidRange: 0, fgaMidRange: 0, tp: 0, tpa: 0, ft: 0, fta: 0, pm: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, ba: 0, pf: 0, pts: 0, courtTime: 0, benchTime: 0, energy: 1};

            t.player.push(p);
        }

        // Number of players to factor into pace and defense rating calculation
        let numPlayers = t.player.length;
        if (numPlayers > 7) {
            numPlayers = 7;
        }

        // Would be better if these were scaled by average min played and endurancence
        t.pace = 0;
        for (let i = 0; i < numPlayers; i++) {
            t.pace += t.player[i].compositeRating.pace;
        }
        t.pace /= numPlayers;
        t.pace = t.pace * 15 + 100;  // Scale between 100 and 115

        // Initialize team composite rating object
        t.compositeRating = {};
        for (const rating of Object.keys(g.compositeWeights)) {
            t.compositeRating[rating] = 0;
        }

        t.stat = {min: 0, fg: 0, fga: 0, fgAtRim: 0, fgaAtRim: 0, fgLowPost: 0, fgaLowPost: 0, fgMidRange: 0, fgaMidRange: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, ast: 0, tov: 0, stl: 0, blk: 0, ba: 0, pf: 0, pts: 0, ptsQtrs: [0]};

        return t;
    });
}

/**
 * Play one or more days of games.
 *
 * This also handles the case where there are no more games to be played by switching the phase to either the playoffs or before the draft, as appropriate.
 *
 * @memberOf core.game
 * @param {number} numDays An integer representing the number of days to be simulated. If numDays is larger than the number of days remaining, then all games will be simulated up until either the end of the regular season or the end of the playoffs, whichever happens first.
 * @param {boolean} start Is this a new request from the user to play games (true) or a recursive callback to simulate another day (false)? If true, then there is a check to make sure simulating games is allowed. Default true.
 * @param {number?} gidPlayByPlay If this number matches a game ID number, then an array of strings representing the play-by-play game simulation are included in the ui.realtimeUpdate raw call.
 */
async function play(numDays, start = true, gidPlayByPlay = null) {
    // This is called when there are no more games to play, either due to the user's request (e.g. 1 week) elapsing or at the end of the regular season
    const cbNoGames = async () => {
        ui.updateStatus("Idle");
        await league.setGameAttributesComplete({gamesInProgress: false});
        await ui.updatePlayMenu(null);
        ui.realtimeUpdate(["g.gamesInProgress"]);

        // Check to see if the season is over
        if (g.phase < g.PHASE.PLAYOFFS) {
            const schedule = await season.getSchedule();
            if (schedule.length === 0) {
                // No return here, meaning no need to wait for phase.newPhase to resolve - is that correct?
                phase.newPhase(g.PHASE.PLAYOFFS);
                ui.updateStatus("Idle"); // Just to be sure..
            }
        }
    };

    // Saves a vector of results objects for a day, as is output from cbSimGames
    const cbSaveResults = async results => {
        const objectStores = ["events", "games", "players", "playerFeats", "playerStats", "playoffSeries", "releasedPlayers", "schedule", "teams", "teamSeasons", "teamStats"];
        await g.dbl.tx(objectStores, "readwrite", async tx => {
            const gidsFinished = await Promise.map(results, async result => {
                const cache = await writeTeamStats(tx, result);
                await writeGameStats(tx, result, cache.att);
                await writePlayerStats(tx, result);
                return result.gid;
            });

            const promises = [];

            // Update playoff series W/L
            if (g.phase === g.PHASE.PLAYOFFS) {
                promises.push(updatePlayoffSeries(tx, results));
            }

            // Delete finished games from schedule
            for (let j = 0; j < gidsFinished.length; j++) {
                promises.push(tx.schedule.delete(gidsFinished[j]));
            }

            // Update ranks
            promises.push(finances.updateRanks(tx, ["expenses", "revenues"]));

            // Injury countdown - This must be after games are saved, of there is a race condition involving new injury assignment in writeStats
            promises.push(tx.players.index('tid').iterate(backboard.lowerBound(g.PLAYER.FREE_AGENT), p => {
                let changed;

                changed = false;
                if (p.injury.gamesRemaining > 0) {
                    p.injury.gamesRemaining -= 1;
                    changed = true;
                }
                // Is it already over?
                if (p.injury.type !== "Healthy" && p.injury.gamesRemaining <= 0) {
                    p.injury = {type: "Healthy", gamesRemaining: 0};
                    changed = true;

                    logEvent(tx, {
                        type: "healed",
                        text: `<a href="${helpers.leagueUrl(["player", p.pid])}">${p.firstName} ${p.lastName}</a> has recovered from his injury.`,
                        showNotification: p.tid === g.userTid,
                        pids: [p.pid],
                        tids: [p.tid],
                    });
                }

                // Also check for gamesUntilTradable
                if (!p.hasOwnProperty("gamesUntilTradable")) {
                    p.gamesUntilTradable = 0; // Initialize for old leagues
                    changed = true;
                } else if (p.gamesUntilTradable > 0) {
                    p.gamesUntilTradable -= 1;
                    changed = true;
                }

                if (changed) {
                    return p;
                }
            }));

            await Promise.all(promises);
        });

        // If there was a play by play done for one of these games, get it
        let raw;
        let url;
        if (gidPlayByPlay !== null) {
            for (let i = 0; i < results.length; i++) {
                if (results[i].playByPlay !== undefined) {
                    raw = {
                        gidPlayByPlay,
                        playByPlay: results[i].playByPlay,
                    };
                    url = helpers.leagueUrl(["live_game"]);
                }
            }
        } else {
            url = undefined;
        }

        await advStats.calculateAll();

        ui.realtimeUpdate(["gameSim"], url, async () => {
            league.updateLastDbChange();

            if (g.phase === g.PHASE.PLAYOFFS) {
                // tx2 is to make sure newSchedulePlayoffsDay finishes before continuing
                const playoffsOver = await g.dbl.tx(["playoffSeries", "schedule", "teamSeasons"], "readwrite", tx2 => season.newSchedulePlayoffsDay(tx2));
                if (playoffsOver) {
                    await phase.newPhase(g.PHASE.BEFORE_DRAFT);
                }
            } else if (Math.random() < 1 / (100 * 50)) {
                // Should a rare tragic event occur? ONLY IN REGULAR SEASON, playoffs would be tricky with roster limits and no free agents
                // 100 days in a season (roughly), and we want a death every 50 years on average
                await player.killOne();
                ui.realtimeUpdate(["playerMovement"]);
            }
            play(numDays - 1, false);
        }, raw);
    };

    // Simulates a day of games (whatever is in schedule) and passes the results to cbSaveResults
    const cbSimGames = async (schedule, teams) => {
        const results = [];
        for (let i = 0; i < schedule.length; i++) {
            const doPlayByPlay = gidPlayByPlay === schedule[i].gid;
            const gs = new GameSim(schedule[i].gid, teams[schedule[i].homeTid], teams[schedule[i].awayTid], doPlayByPlay);
            results.push(gs.run());
        }
        await cbSaveResults(results);
    };

    // Simulates a day of games. If there are no games left, it calls cbNoGames.
    // Promise is resolved after games are run
    const cbPlayGames = async () => {
        if (numDays === 1) {
            ui.updateStatus("Playing (1 day left)");
        } else {
            ui.updateStatus(`Playing (${numDays} days left)`);
        }

        await g.dbl.tx(["players", "schedule", "teams", "teamSeasons"], async tx => {
            let schedule = await season.getSchedule({ot: tx, oneDay: true});

            // Stop if no games
            // This should also call cbNoGames after the playoffs end, because g.phase will have been incremented by season.newSchedulePlayoffsDay after the previous day's games
            if (schedule.length === 0 && g.phase !== g.PHASE.PLAYOFFS) {
                return cbNoGames();
            }

            // Load all teams, for now. Would be more efficient to load only some of them, I suppose.
            const teams = await loadTeams(tx);

            // Play games
            // Will loop through schedule and simulate all games
            if (schedule.length === 0 && g.phase === g.PHASE.PLAYOFFS) {
                // Sometimes the playoff schedule isn't made the day before, so make it now
                // This works because there should always be games in the playoffs phase. The next phase will start before reaching this point when the playoffs are over.

                // tx2 to make sure newSchedulePlayoffsDay finishes before continuing
                await g.dbl.tx(["playoffSeries", "schedule", "teamSeasons"], "readwrite", tx2 => season.newSchedulePlayoffsDay(tx2));
                schedule = await season.getSchedule({oneDay: true});
            }
            await cbSimGames(schedule, teams);
        });
    };

    // This simulates a day, including game simulation and any other bookkeeping that needs to be done
    const cbRunDay = async () => {
        if (numDays > 0) {
            // Hit the DB to check stopGames in case it came from another tab
            await league.loadGameAttribute(null, "stopGames");

            // If we didn't just stop games, let's play
            // Or, if we are starting games (and already passed the lock), continue even if stopGames was just seen
            if (start || !g.stopGames) {
                // If start is set, then reset stopGames
                if (g.stopGames) {
                    await league.setGameAttributesComplete({stopGames: false});
                }

                if (g.phase !== g.PHASE.PLAYOFFS) {
                    await freeAgents.decreaseDemands();
                    await freeAgents.autoSign();
                }

                await cbPlayGames();
            } else {
                // Update UI if stopped
                await cbNoGames();
            }
        } else if (numDays === 0) {
            // If this is the last day, update play menu
            await cbNoGames();
        }
    };

    // If this is a request to start a new simulation... are we allowed to do
    // that? If so, set the lock and update the play menu
    if (start) {
        const canStartGames = await lock.canStartGames(null);
        if (canStartGames) {
            const userTeamSizeError = await team.checkRosterSizes();
            if (userTeamSizeError === null) {
                await league.setGameAttributesComplete({gamesInProgress: true});
                await ui.updatePlayMenu(null);
                ui.realtimeUpdate(["g.gamesInProgress"]);
                cbRunDay();
            } else {
                ui.updateStatus("Idle");
                helpers.errorNotify(userTeamSizeError);
            }
        }
    } else {
        cbRunDay();
    }
}

export {
    // eslint-disable-next-line import/prefer-default-export
    play,
};
