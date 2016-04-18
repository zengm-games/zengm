const g = require('../globals');
const ui = require('../ui');
const contractNegotiation = require('./contractNegotiation');
const draft = require('./draft');
const finances = require('./finances');
const freeAgents = require('./freeAgents');
const player = require('./player');
const season = require('./season');
const team = require('./team');
const backboard = require('backboard');
const Promise = require('bluebird');
const _ = require('underscore');
const account = require('../util/account');
const ads = require('../util/ads');
const eventLog = require('../util/eventLog');
const helpers = require('../util/helpers');
const lock = require('../util/lock');
const message = require('../util/message');
const random = require('../util/random');

let phaseChangeTx;

/**
 * Common tasks run after a new phrase is set.
 *
 * This updates the phase, executes a callback, and (if necessary) updates the UI. It should only be called from one of the NewPhase* functions defined below.
 *
 * @memberOf core.phase
 * @param {number} phase Integer representing the new phase of the game (see other functions in this module).
 * @param {string=} url Optional URL to pass to ui.realtimeUpdate for redirecting on new phase. If undefined, then the current page will just be refreshed.
 * @param {Array.<string>=} updateEvents Optional array of strings.
 * @return {Promise}
 */
function finalize(phase, url, updateEvents=[]) {
    // Set phase before updating play menu
    return require('../core/league').setGameAttributesComplete({phase, phaseChangeInProgress: false}).then(() => {
        ui.updatePhase(`${g.season} ${g.PHASE_TEXT[phase]}`);
        return ui.updatePlayMenu(null).then(() => {
            // Set lastDbChange last so there is no race condition (WHAT DOES THIS MEAN??)
            require('../core/league').updateLastDbChange();
            updateEvents.push("newPhase");
            ui.realtimeUpdate(updateEvents, url);
        });
    }).then(() => {
        // If auto-simulating, initiate next action
        if (g.autoPlaySeasons > 0) {
            // Not totally sure why setTimeout is needed, but why not?
            setTimeout(() => {
                require('../core/league').autoPlay();
            }, 100);
        }
    });
}

function newPhasePreseason(tx) {
    return freeAgents.autoSign(tx).then(() => require('../core/league').setGameAttributes(tx, {season: g.season + 1})).then(() => {
        let scoutingRank, tid, tids;

        tids = [];
        for (tid = 0; tid < g.numTeams; tid++) {
            tids.push(tid);
        }

        return Promise.map(tids, tid => Promise.try(() => {
            // Only need scoutingRank for the user's team to calculate fuzz when ratings are updated below.
            // This is done BEFORE a new season row is added.
            if (tid === g.userTid) {
                return tx.teamSeasons.index("tid, season").getAll(backboard.bound([tid, g.season - 3], [tid, g.season - 1])).then(teamSeasons => {
                    scoutingRank = finances.getRankLastThree(teamSeasons, "expenses", "scouting");

                    return teamSeasons[teamSeasons.length - 1];
                });
            }

            return tx.teamSeasons.index("tid, season").get([tid, g.season - 1]);
        }).then(prevSeason => Promise.all([
            tx.teamSeasons.add(team.genSeasonRow(tid, prevSeason)),
            tx.teamStats.add(team.genStatsRow(tid))
        ])).then(() => {})).then(() => tx.teamSeasons.index("season, tid").getAll(backboard.bound([g.season - 1], [g.season - 1, ''])).map(teamSeason => teamSeason.expenses.coaching.rank)).then(coachingRanks => tx.players.index('tid').iterate(backboard.lowerBound(g.PLAYER.FREE_AGENT), p => {
            // Update ratings
            p = player.addRatingsRow(p, scoutingRank);
            p = player.develop(p, 1, false, coachingRanks[p.tid]);

            // Update player values after ratings changes
            return player.updateValues(tx, p, []).then(p => {
                // Add row to player stats if they are on a team
                if (p.tid >= 0) {
                    p = player.addStatsRow(tx, p, false);
                }
                return p;
            });
        })).then(() => {
            if (g.autoPlaySeasons > 0) {
                return require('../core/league').setGameAttributes(tx, {autoPlaySeasons: g.autoPlaySeasons - 1});
            }
        }).then(() => {
            if (g.enableLogging && !window.inCordova) {
                ads.show();
            }

            return [undefined, ["playerMovement"]];
        });
    });
}

function newPhaseRegularSeason(tx) {
    return tx.teams.getAll().then(teams => season.setSchedule(tx, season.newSchedule(teams))).then(() => {
        let nagged;

        // First message from owner
        if (g.showFirstOwnerMessage) {
            return message.generate(tx, {wins: 0, playoffs: 0, money: 0});
        }

        // Spam user with another message?
        if (localStorage.nagged === "true") {
            // This used to store a boolean, switch to number
            localStorage.nagged = "1";
        } else if (localStorage.nagged === undefined) {
            localStorage.nagged = "0";
        }

        nagged = parseInt(localStorage.nagged, 10);

        if (g.season === g.startingSeason + 3 && g.lid > 3 && nagged === 0) {
            localStorage.nagged = "1";
            return tx.messages.add({
                read: false,
                from: "The Commissioner",
                year: g.season,
                text: '<p>Hi. Sorry to bother you, but I noticed that you\'ve been playing this game a bit. Hopefully that means you like it. Either way, we would really appreciate some feedback so we can make this game better. <a href="mailto:commissioner@basketball-gm.com">Send an email</a> (commissioner@basketball-gm.com) or <a href="http://www.reddit.com/r/BasketballGM/">join the discussion on Reddit</a>.</p>'
            });
        }
        if ((nagged === 1 && Math.random() < 0.25) || (nagged >= 2 && Math.random < 0.025)) {
            localStorage.nagged = "2";
            return tx.messages.add({
                read: false,
                from: "The Commissioner",
                year: g.season,
                text: '<p>Hi. Sorry to bother you again, but if you like the game, please share it with your friends! Also:</p><p><a href="https://twitter.com/basketball_gm">Follow Basketball GM on Twitter</a></p><p><a href="https://www.facebook.com/basketball.general.manager">Like Basketball GM on Facebook</a></p><p><a href="http://www.reddit.com/r/BasketballGM/">Discuss Basketball GM on Reddit</a></p><p>The more people that play Basketball GM, the more motivation I have to continue improving it. So it is in your best interest to help me promote the game! If you have any other ideas, please <a href="mailto:commissioner@basketball-gm.com">email me</a>.</p>'
            });
        }
        // Skipping 3, obsolete
        if ((nagged >= 2 && nagged <= 3 && Math.random() < 0.5) || (nagged >= 4 && Math.random < 0.05)) {
            localStorage.nagged = "4";
            return tx.messages.add({
                read: false,
                from: "The Commissioner",
                year: g.season,
                text: '<p>Want to try multiplayer Basketball GM? Some intrepid souls have banded together to form online multiplayer leagues, and <a href="http://basketball-gm.co.nf/">you can find a user-made list of them here</a>.</p>'
            });
        }
    }).then(() => [undefined, ["playerMovement"]]);
}

function newPhaseAfterTradeDeadline() {
    throw new Error("newPhaseAfterTradeDeadline not implemented");
}

function newPhasePlayoffs(tx) {
    // Achievements after regular season
    account.checkAchievement.septuawinarian();

    // Set playoff matchups
    return team.filter({
        ot: tx,
        attrs: ["tid", "cid"],
        seasonAttrs: ["winp"],
        season: g.season,
        sortBy: "winp"
    }).then(teams => {
        let cid, i, series, teamsConf, tidPlayoffs;

        // Add entry for wins for each team; delete winp, which was only needed for sorting
        for (i = 0; i < teams.length; i++) {
            teams[i].won = 0;
        }

        if (!localStorage.top16playoffs) {
            // Default: top 8 teams in each conference
            tidPlayoffs = [];
            series = [[], [], [], []];  // First round, second round, third round, fourth round
            for (cid = 0; cid < 2; cid++) {
                teamsConf = [];
                for (i = 0; i < teams.length; i++) {
                    if (teams[i].cid === cid) {
                        if (teamsConf.length < 8) {
                            teamsConf.push(teams[i]);
                            tidPlayoffs.push(teams[i].tid);
                        }
                    }
                }
                series[0][cid * 4] = {home: teamsConf[0], away: teamsConf[7]};
                series[0][cid * 4].home.seed = 1;
                series[0][cid * 4].away.seed = 8;
                series[0][1 + cid * 4] = {home: teamsConf[3], away: teamsConf[4]};
                series[0][1 + cid * 4].home.seed = 4;
                series[0][1 + cid * 4].away.seed = 5;
                series[0][2 + cid * 4] = {home: teamsConf[2], away: teamsConf[5]};
                series[0][2 + cid * 4].home.seed = 3;
                series[0][2 + cid * 4].away.seed = 6;
                series[0][3 + cid * 4] = {home: teamsConf[1], away: teamsConf[6]};
                series[0][3 + cid * 4].home.seed = 2;
                series[0][3 + cid * 4].away.seed = 7;
            }
        } else {
            // Alternative (localStorage.top16playoffs): top 16 teams overall
            tidPlayoffs = [];
            series = [[], [], [], []];  // First round, second round, third round, fourth round
            teamsConf = [];
            for (i = 0; i < teams.length; i++) {
                if (teamsConf.length < 16) {
                    teamsConf.push(teams[i]);
                    tidPlayoffs.push(teams[i].tid);
                }
            }
            series[0][0] = {home: teamsConf[0], away: teamsConf[15]};
            series[0][0].home.seed = 1;
            series[0][0].away.seed = 16;
            series[0][1] = {home: teamsConf[7], away: teamsConf[8]};
            series[0][1].home.seed = 8;
            series[0][1].away.seed = 9;
            series[0][2] = {home: teamsConf[3], away: teamsConf[12]};
            series[0][2].home.seed = 4;
            series[0][2].away.seed = 13;
            series[0][3] = {home: teamsConf[4], away: teamsConf[11]};
            series[0][3].home.seed = 5;
            series[0][3].away.seed = 12;
            series[0][4] = {home: teamsConf[1], away: teamsConf[14]};
            series[0][4].home.seed = 2;
            series[0][4].away.seed = 15;
            series[0][5] = {home: teamsConf[6], away: teamsConf[9]};
            series[0][5].home.seed = 7;
            series[0][5].away.seed = 10;
            series[0][6] = {home: teamsConf[2], away: teamsConf[13]};
            series[0][6].home.seed = 3;
            series[0][6].away.seed = 14;
            series[0][7] = {home: teamsConf[5], away: teamsConf[10]};
            series[0][7].home.seed = 6;
            series[0][7].away.seed = 11;
        }

        tidPlayoffs.forEach(tid => {
            eventLog.add(null, {
                type: "playoffs",
                text: `The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[tid], g.season])}">${g.teamNamesCache[tid]}</a> made the <a href="${helpers.leagueUrl(["playoffs", g.season])}">playoffs</a>.`,
                showNotification: tid === g.userTid,
                tids: [tid]
            });
        });

        return Promise.all([
            tx.playoffSeries.put({
                season: g.season,
                currentRound: 0,
                series
            }),

            // Add row to team stats and team season attributes
            tx.teamSeasons.index("season, tid").iterate(backboard.bound([g.season], [g.season, '']), teamSeason => {
                if (tidPlayoffs.indexOf(teamSeason.tid) >= 0) {
                    tx.teamStats.add(team.genStatsRow(teamSeason.tid, true));

                    teamSeason.playoffRoundsWon = 0;

                    // More hype for making the playoffs
                    teamSeason.hype += 0.05;
                    if (teamSeason.hype > 1) {
                        teamSeason.hype = 1;
                    }
                } else {
                    // Less hype for missing the playoffs
                    teamSeason.hype -= 0.05;
                    if (teamSeason.hype < 0) {
                        teamSeason.hype = 0;
                    }
                }

                return teamSeason;
            }),

            // Add row to player stats
            Promise.map(tidPlayoffs, tid => tx.players.index('tid').iterate(tid, p => player.addStatsRow(tx, p, true)))
        ]);
    }).then(() => Promise.all([
        finances.assessPayrollMinLuxury(tx),
        season.newSchedulePlayoffsDay(tx)
    ])).then(() => {
        let url;

        // Don't redirect if we're viewing a live game now
        if (location.pathname.indexOf("/live_game") === -1) {
            url = helpers.leagueUrl(["playoffs"]);
        }

        return [url, ["teamFinances"]];
    });
}

function newPhaseBeforeDraft(tx) {
    // Achievements after playoffs
    account.checkAchievement.fo_fo_fo();
    account.checkAchievement["98_degrees"]();
    account.checkAchievement.dynasty();
    account.checkAchievement.dynasty_2();
    account.checkAchievement.dynasty_3();
    account.checkAchievement.moneyball();
    account.checkAchievement.moneyball_2();
    account.checkAchievement.small_market();

    // Select winners of the season's awards
    return season.awards(tx).then(() => team.filter({
        ot: tx,
        attrs: ["tid"],
        seasonAttrs: ["playoffRoundsWon"],
        season: g.season
    })).then(teams => {
        let i, tid;

        // Give award to all players on the championship team
        for (i = 0; i < teams.length; i++) {
            if (teams[i].playoffRoundsWon === 4) {
                tid = teams[i].tid;
                break;
            }
        }
        return tx.players.index('tid').iterate(tid, p => {
            p.awards.push({season: g.season, type: "Won Championship"});
            return p;
        });
    }).then(() => {
        let maxAge, minPot;

        // Do annual tasks for each player, like checking for retirement

        // Players meeting one of these cutoffs might retire
        maxAge = 34;
        minPot = 40;

        return tx.players.index('tid').iterate(backboard.lowerBound(g.PLAYER.FREE_AGENT), p => {
            let update;

            update = false;

            // Get player stats, used for HOF calculation
            return tx.playerStats.index("pid, season, tid").getAll(backboard.bound([p.pid], [p.pid, ''])).then(playerStats => {
                let age, excessAge, excessPot, pot;

                age = g.season - p.born.year;
                pot = p.ratings[p.ratings.length - 1].pot;

                if (age > maxAge || pot < minPot) {
                    excessAge = 0;
                    if (age > 34 || p.tid === g.PLAYER.FREE_AGENT) {  // Only players older than 34 or without a contract will retire
                        if (age > 34) {
                            excessAge = (age - 34) / 20;  // 0.05 for each year beyond 34
                        }
                        excessPot = (40 - pot) / 50;  // 0.02 for each potential rating below 40 (this can be negative)
                        if (excessAge + excessPot + random.gauss(0, 1) > 0) {
                            p = player.retire(tx, p, playerStats);
                            update = true;
                        }
                    }
                }

                // Update "free agent years" counter and retire players who have been free agents for more than one years
                if (p.tid === g.PLAYER.FREE_AGENT) {
                    if (p.yearsFreeAgent >= 1) {
                        p = player.retire(tx, p, playerStats);
                    } else {
                        p.yearsFreeAgent += 1;
                    }
                    p.contract.exp += 1;
                    update = true;
                } else if (p.tid >= 0 && p.yearsFreeAgent > 0) {
                    p.yearsFreeAgent = 0;
                    update = true;
                }

                // Heal injures
                if (p.injury.type !== "Healthy") {
                    // This doesn't use g.numGames because that would unfairly make injuries last longer if it was lower - if anything injury duration should be modulated based on that, but oh well
                    if (p.injury.gamesRemaining <= 82) {
                        p.injury = {type: "Healthy", gamesRemaining: 0};
                    } else {
                        p.injury.gamesRemaining -= 82;
                    }
                    update = true;
                }

                // Update player in DB, if necessary
                if (update) {
                    return p;
                }
            });
        });
    }).then(() => tx.releasedPlayers.index('contract.exp').iterate(backboard.upperBound(g.season), rp => {
        tx.releasedPlayers.delete(rp.rid);
    })).then(() => team.updateStrategies(tx)).then(() => season.updateOwnerMood(tx)).then(deltas => message.generate(tx, deltas)).then(() => {
        let url;

        // Don't redirect if we're viewing a live game now
        if (location.pathname.indexOf("/live_game") === -1) {
            url = helpers.leagueUrl(["history"]);
        }

        helpers.bbgmPing("season");

        return [url, ["playerMovement"]];
    });
}

function newPhaseDraft(tx) {
    // Achievements after awards
    account.checkAchievement.hardware_store();
    account.checkAchievement.sleeper_pick();

    // Kill off old retired players (done here since not much else happens in this phase change, so making it a little slower is fine)
    return tx.players.index('tid').iterate(g.PLAYER.RETIRED, p => {
        let probDeath;
        if (p.hasOwnProperty("diedYear") && p.diedYear) {
            return;
        }

        // Formula badly fit to http://www.ssa.gov/oact/STATS/table4c6.html
        probDeath = 0.0001165111 * Math.exp(0.0761889274 * (g.season - p.born.year));

        if (Math.random() < probDeath) {
            p.diedYear = g.season;
            return p;
        }
    }).then(() => draft.genOrder(tx)).then(() => tx.players.index('draft.year').iterate(g.season, p => {
        if (p.tid >= 0) {
            p.draft.year -= 1;
            return p;
        }
    })).then(() => [helpers.leagueUrl(["draft"])]);
}

function newPhaseAfterDraft(tx) {
    return draft.genPicks(tx).then(function () {
        return [undefined, ["playerMovement"]];
    });
}

function newPhaseResignPlayers(tx) {
    return player.genBaseMoods(tx).then(baseMoods => tx.players.index('tid').iterate(backboard.lowerBound(0), p => {
        let tid;

        if (p.contract.exp <= g.season && g.userTids.indexOf(p.tid) >= 0 && g.autoPlaySeasons === 0) {
            tid = p.tid;

            // Add to free agents first, to generate a contract demand
            return player.addToFreeAgents(tx, p, g.PHASE.RESIGN_PLAYERS, baseMoods).then(() => contractNegotiation.create(tx, p.pid, true, tid).then(error => {
                if (error !== undefined && error) {
                    eventLog.add(null, {
                        type: "refuseToSign",
                        text: error,
                        pids: [p.pid],
                        tids: [tid]
                    });
                }
            }));
        }
    })).then(() => require('../core/league').setGameAttributes(tx, {daysLeft: 30})).then(() => [helpers.leagueUrl(["negotiation"]), ["playerMovement"]]);
}

function newPhaseFreeAgency(tx) {
    let strategies;

    return team.filter({
        ot: tx,
        attrs: ["strategy"],
        season: g.season
    }).then(teams => {
        strategies = _.pluck(teams, "strategy");

        // Delete all current negotiations to resign players
        return contractNegotiation.cancelAll(tx);
    }).then(() => player.genBaseMoods(tx).then(baseMoods => tx.players.index('tid').iterate(backboard.bound(g.PLAYER.UNDRAFTED, g.PLAYER.FREE_AGENT), p => player.addToFreeAgents(tx, p, g.PHASE.FREE_AGENCY, baseMoods)).then(() => tx.players.index('tid').iterate(backboard.lowerBound(0), p => {
        let contract, factor;

        if (p.contract.exp <= g.season && (g.userTids.indexOf(p.tid) < 0 || g.autoPlaySeasons > 0)) {
            // Automatically negotiate with teams
            if (strategies[p.tid] === "rebuilding") {
                factor = 0.4;
            } else {
                factor = 0;
            }

            if (Math.random() < p.value / 100 - factor) { // Should eventually be smarter than a coin flip
                // See also core.team
                contract = player.genContract(p);
                contract.exp += 1; // Otherwise contracts could expire this season
                p = player.setContract(p, contract, true);
                p.gamesUntilTradable = 15;

                eventLog.add(null, {
                    type: "reSigned",
                    text: `${p.contract.amount / 1000}The <a href="${helpers.leagueUrl(["roster", g.teamAbbrevsCache[p.tid], g.season])}">${g.teamNamesCache[p.tid]}</a> re-signed <a href="${helpers.leagueUrl(["player", p.pid])}">${p.name}</a> for ${helpers.formatCurrency(p.contract.amount / 1000, "M")}/year through ${p.contract.exp}.`,
                    showNotification: false,
                    pids: [p.pid],
                    tids: [p.tid]
                });

                return p; // Other endpoints include calls to addToFreeAgents, which handles updating the database
            }

            return player.addToFreeAgents(tx, p, g.PHASE.RESIGN_PLAYERS, baseMoods);
        }
    }))).then(() => tx.players.index('tid').iterate(g.PLAYER.UNDRAFTED_2, p => {
        p.tid = g.PLAYER.UNDRAFTED;
        p.ratings[0].fuzz /= 2;
        return p;
    }).then(() => tx.players.index('tid').iterate(g.PLAYER.UNDRAFTED_3, p => {
        p.tid = g.PLAYER.UNDRAFTED_2;
        p.ratings[0].fuzz /= 2;
        return p;
    }))).then(() => draft.genPlayers(tx, g.PLAYER.UNDRAFTED_3)).then(() => [helpers.leagueUrl(["free_agents"]), ["playerMovement"]]));
}

function newPhaseFantasyDraft(tx, position) {
    return contractNegotiation.cancelAll(tx).then(() => draft.genOrderFantasy(tx, position)).then(() => require('../core/league').setGameAttributes(tx, {nextPhase: g.phase})).then(() => tx.players.index('tid').iterate(g.PLAYER.UNDRAFTED, p => {
        p.tid = g.PLAYER.UNDRAFTED_FANTASY_TEMP;
        return p;
    }).then(() => {
        // Make all players draftable
        tx.players.index('tid').iterate(backboard.lowerBound(g.PLAYER.FREE_AGENT), p => {
            p.tid = g.PLAYER.UNDRAFTED;
            return p;
        });
    })).then(() => tx.releasedPlayers.clear()).then(() => [helpers.leagueUrl(["draft"]), ["playerMovement"]]);
}

/**
 * Set a new phase of the game.
 *
 * This function is called to do all the crap that must be done during transitions between phases of the game, such as moving from the regular season to the playoffs. Phases are defined in the g.PHASE.* global variables. The phase update may happen asynchronously if the database must be accessed, so do not rely on g.phase being updated immediately after this function is called. Instead, pass a callback.
 *
 * phaseChangeTx contains the transaction for the phase change. Phase changes are atomic: if there is an error, it all gets cancelled. The user can also manually abort the phase change. IMPORTANT: For this reason, gameAttributes must be included in every phaseChangeTx to prevent g.phaseChangeInProgress from being changed. Since phaseChangeTx is readwrite, nothing else will be able to touch phaseChangeInProgress until it finishes.
 *
 * @memberOf core.phase
 * @param {number} phase Numeric phase ID. This should always be one of the g.PHASE.* variables defined in globals.js.
 * @param {} extra Parameter containing extra info to be passed to phase changing function. Currently only used for newPhaseFantasyDraft.
 * @return {Promise}
 */
function newPhase(phase, extra) {
    let phaseErrorHandler;

    // Prevent at least some cases of code running twice
    if (phase === g.phase) {
        return;
    }

    // Have this catch any newPhase* errors before phaseChangeTx completes
    phaseErrorHandler = err => {
        if (phaseChangeTx && phaseChangeTx.abort) {
            phaseChangeTx.abort();
        }

        return require('../core/league').setGameAttributesComplete({phaseChangeInProgress: false}).then(() => ui.updatePlayMenu(null)).then(() => eventLog.add(null, {
            type: "error",
            text: 'Critical error during phase change. <a href="https://basketball-gm.com/manual/debugging/"><b>Read this to learn about debugging.</b></a>',
            saveToDb: false,
            persistent: true
        })).then(() => {
            throw err;
        });
    };

    return lock.phaseChangeInProgress(null).then(phaseChangeInProgress => {
        if (!phaseChangeInProgress) {
            return require('../core/league').setGameAttributesComplete({phaseChangeInProgress: true}).then(() => {
                ui.updatePlayMenu(null);

                // In Chrome, this will update play menu in other windows. In Firefox, it won't because ui.updatePlayMenu gets blocked until phaseChangeTx finishes for some reason.
                require('../core/league').updateLastDbChange();

                if (phase === g.PHASE.PRESEASON) {
                    return g.dbl.tx(["gameAttributes", "players", "playerStats", "releasedPlayers", "teams", "teamSeasons", "teamStats"], "readwrite", tx => {
                        phaseChangeTx = tx;
                        return newPhasePreseason(tx).catch(phaseErrorHandler);
                    });
                }
                if (phase === g.PHASE.REGULAR_SEASON) {
                    return g.dbl.tx(["gameAttributes", "messages", "schedule", "teams"], "readwrite", tx => {
                        phaseChangeTx = tx;
                        return newPhaseRegularSeason(tx).catch(phaseErrorHandler);
                    });
                }
                if (phase === g.PHASE.AFTER_TRADE_DEADLINE) {
                    return newPhaseAfterTradeDeadline();
                }
                if (phase === g.PHASE.PLAYOFFS) {
                    return g.dbl.tx(["players", "playerStats", "playoffSeries", "releasedPlayers", "schedule", "teams", "teamSeasons", "teamStats"], "readwrite", tx => {
                        phaseChangeTx = tx;
                        return newPhasePlayoffs(tx).catch(phaseErrorHandler);
                    });
                }
                if (phase === g.PHASE.BEFORE_DRAFT) {
                    return g.dbl.tx(["awards", "events", "gameAttributes", "messages", "players", "playerStats", "releasedPlayers", "teams", "teamSeasons", "teamStats"], "readwrite", tx => {
                        phaseChangeTx = tx;
                        return newPhaseBeforeDraft(tx).catch(phaseErrorHandler);
                    });
                }
                if (phase === g.PHASE.DRAFT) {
                    return g.dbl.tx(["draftPicks", "draftOrder", "gameAttributes", "players", "teams", "teamSeasons", "teamStats"], "readwrite", tx => {
                        phaseChangeTx = tx;
                        return newPhaseDraft(tx).catch(phaseErrorHandler);
                    });
                }
                if (phase === g.PHASE.AFTER_DRAFT) {
                    return g.dbl.tx(["draftPicks", "gameAttributes"], "readwrite", tx => {
                        phaseChangeTx = tx;
                        return newPhaseAfterDraft(tx).catch(phaseErrorHandler);
                    });
                }
                if (phase === g.PHASE.RESIGN_PLAYERS) {
                    return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players", "teams", "teamSeasons", "teamStats"], "readwrite", tx => {
                        phaseChangeTx = tx;
                        return newPhaseResignPlayers(tx).catch(phaseErrorHandler);
                    });
                }
                if (phase === g.PHASE.FREE_AGENCY) {
                    return g.dbl.tx(["gameAttributes", "messages", "negotiations", "players", "teams", "teamSeasons", "teamStats"], "readwrite", tx => {
                        phaseChangeTx = tx;
                        return newPhaseFreeAgency(tx).catch(phaseErrorHandler);
                    });
                }
                if (phase === g.PHASE.FANTASY_DRAFT) {
                    return g.dbl.tx(["draftOrder", "gameAttributes", "messages", "negotiations", "players", "releasedPlayers"], "readwrite", tx => {
                        phaseChangeTx = tx;
                        return newPhaseFantasyDraft(tx, extra).catch(phaseErrorHandler);
                    });
                }
            }).spread((url, updateEvents) => finalize(phase, url, updateEvents));
        }

        helpers.errorNotify("Phase change already in progress, maybe in another tab.");
    });
}

function abort() {
    try {
        phaseChangeTx.abort();
    } catch (err) {
        // Could be here because tx already ended, phase change is happening in another tab, or something weird.
        console.log("This is probably not actually an error:");
        console.log(err);
        helpers.errorNotify("If \"Abort\" doesn't work, check if you have another tab open.");
    } finally {
        // If another window has a phase change in progress, this won't do anything until that finishes
        require('../core/league').setGameAttributesComplete({phaseChangeInProgress: false}).then(() => ui.updatePlayMenu(null));
    }
}

module.exports = {
    newPhase,
    abort
};
