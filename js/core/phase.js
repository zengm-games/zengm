/**
 * @name core.phase
 * @namespace Anything related to moving between phases of the game (e.g. regular season, playoffs, draft, etc.).
 */
define(["dao", "globals", "ui", "core/contractNegotiation", "core/draft", "core/finances", "core/freeAgents", "core/player", "core/season", "core/team", "lib/bluebird", "lib/underscore", "util/account", "util/ads", "util/eventLog", "util/helpers", "util/message", "util/random"], function (dao, g, ui, contractNegotiation, draft, finances, freeAgents, player, season, team, Promise, _, account, ads, eventLog, helpers, message, random) {
    "use strict";

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
    function finalize(phase, url, updateEvents) {
        updateEvents = updateEvents !== undefined ? updateEvents : [];

        // Set phase before updating play menu
        return require("core/league").setGameAttributesComplete({phase: phase}).then(function () {
            ui.updatePhase(g.season + g.PHASE_TEXT[phase]);
            return ui.updatePlayMenu(null).then(function () {
                // Set lastDbChange last so there is no race condition (WHAT DOES THIS MEAN??)
                require("core/league").updateLastDbChange();
                updateEvents.push("newPhase");
                ui.realtimeUpdate(updateEvents, url);
            });
        });
    }

    function newPhasePreseason(tx) {
        return freeAgents.autoSign(tx).then(function () { // Important: do this before changing the season or contracts and stats are fucked up
            return require("core/league").setGameAttributes(tx, {season: g.season + 1});
        }).then(function () {
            var coachingRanks, scoutingRank;

            coachingRanks = [];

            // Add row to team stats and season attributes
            return dao.teams.iterate({
                ot: tx,
                callback: function (t) {
                    // Save the coaching rank for later
                    coachingRanks[t.tid] = _.last(t.seasons).expenses.coaching.rank;

                    // Only need scoutingRank for the user's team to calculate fuzz when ratings are updated below.
                    // This is done BEFORE a new season row is added.
                    if (t.tid === g.userTid) {
                        scoutingRank = finances.getRankLastThree(t, "expenses", "scouting");
                    }

                    t = team.addSeasonRow(t);
                    t = team.addStatsRow(t);

                    return t;
                }
            }).then(function () {
                // Loop through all non-retired players
                return dao.players.iterate({
                    ot: tx,
                    index: "tid",
                    key: IDBKeyRange.lowerBound(g.PLAYER.FREE_AGENT),
                    callback: function (p) {
                        // Update ratings
                        p = player.addRatingsRow(p, scoutingRank);
                        p = player.develop(p, 1, false, coachingRanks[p.tid]);

                        // Update player values after ratings changes
                        return player.updateValues(tx, p, []).then(function (p) {
                            // Add row to player stats if they are on a team
                            if (p.tid >= 0) {
                                p = player.addStatsRow(tx, p, false);
                            }
                            return p;
                        });
                    }
                });
            }).then(function () {
                if (g.enableLogging && !window.inCordova) {
                    ads.show();
                }

                return [undefined, ["playerMovement"]];
            });
        });
    }

    function newPhaseRegularSeason(tx) {
        return season.setSchedule(tx, season.newSchedule()).then(function () {
            // First message from owner
            if (g.showFirstOwnerMessage) {
                return message.generate(tx, {wins: 0, playoffs: 0, money: 0});
            }

            // Spam user with another message?
            if (localStorage.nagged === "true") {
                // This used to store a boolean, switch to number
                localStorage.nagged = "1";
            }

            if (g.season === g.startingSeason + 3 && g.lid > 3 && !localStorage.nagged) {
                localStorage.nagged = "1";
                return dao.messages.add({
                    ot: tx,
                    value: {
                        read: false,
                        from: "The Commissioner",
                        year: g.season,
                        text: '<p>Hi. Sorry to bother you, but I noticed that you\'ve been playing this game a bit. Hopefully that means you like it. Either way, we would really appreciate some feedback so we can make this game better. <a href="mailto:commissioner@basketball-gm.com">Send an email</a> (commissioner@basketball-gm.com) or <a href="http://www.reddit.com/r/BasketballGM/">join the discussion on Reddit</a>.</p>'
                    }
                });
            }
            if ((localStorage.nagged === "1" && Math.random() < 0.25) || (localStorage.nagged === "2" && Math.random < 0.025)) {
                localStorage.nagged = "2";
                return dao.messages.add({
                    ot: tx,
                    value: {
                        read: false,
                        from: "The Commissioner",
                        year: g.season,
                        text: '<p>Hi. Sorry to bother you again, but if you like the game, please share it with your friends! Also:</p><p><a href="https://twitter.com/basketball_gm">Follow Basketball GM on Twitter</a></p><p><a href="https://www.facebook.com/basketball.general.manager">Like Basketball GM on Facebook</a></p><p><a href="http://www.reddit.com/r/BasketballGM/">Discuss Basketball GM on Reddit</a></p><p>The more people that play Basketball GM, the more motivation I have to continue improving it. So it is in your best interest to help me promote the game! If you have any other ideas, please <a href="mailto:commissioner@basketball-gm.com">email me</a>.</p>'
                    }
                });
            }
            if ((localStorage.nagged === "2" && Math.random() < 0.25) || (localStorage.nagged === "3" && Math.random < 0.025)) {
                _gaq.push(["_trackEvent", "Ad Display", "DraftKings"]);
                localStorage.nagged = "3";
                return dao.messages.add({
                    ot: tx,
                    value: {
                        read: false,
                        from: "The Commissioner",
                        year: g.season,
                        text: '<p>DraftKings is a great new way to play fantasy sports and win money. They are running a special promotion for Basketball GM players: they\'ll waive the entry fee for a $30k fantasy NBA pool and match your first deposit for free! All you have to do is draft the best 8 player team. Your Basketball GM experience may prove to be useful!</p><p><a href="https://www.draftkings.com/gateway?s=640365236"><img src="/img/dk-logo.png"></a></p><p>And better yet, by signing up through <a href="https://www.draftkings.com/gateway?s=640365236">this link</a>, you will be supporting Basketball GM. So even if you\'re not totally sure if you want to try DraftKings, give it a shot as a personal favor to me. In return, I will continue to improve this free game that you\'ve spent hours playing - there is some cool stuff in the works, stay tuned!</p>'
                    }
                });
            }
        });
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
        }).then(function (teams) {
            var cid, i, series, teamsConf, tidPlayoffs;

            // Add entry for wins for each team; delete winp, which was only needed for sorting
            for (i = 0; i < teams.length; i++) {
                teams[i].won = 0;
            }

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

            if (tidPlayoffs.indexOf(g.userTid) >= 0) {
                eventLog.add(null, {
                    type: "playoffs",
                    text: 'Your team made <a href="' + helpers.leagueUrl(["playoffs", g.season]) + '">the playoffs</a>.'
                });
            } else {
                eventLog.add(null, {
                    type: "playoffs",
                    text: 'Your team didn\'t make <a href="' + helpers.leagueUrl(["playoffs", g.season]) + '">the playoffs</a>.'
                });
            }

            return Promise.all([
                dao.playoffSeries.put({
                    ot: tx,
                    value: {
                        season: g.season,
                        currentRound: 0,
                        series: series
                    }
                }),

                // Add row to team stats and team season attributes
                dao.teams.iterate({
                    ot: tx,
                    callback: function (t) {
                        var teamSeason;

                        teamSeason = t.seasons[t.seasons.length - 1];

                        if (tidPlayoffs.indexOf(t.tid) >= 0) {
                            t = team.addStatsRow(t, true);

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

                        return t;
                    }
                }),

                // Add row to player stats
                Promise.map(tidPlayoffs, function (tid) {
                    return dao.players.iterate({
                        ot: tx,
                        index: "tid",
                        key: tid,
                        callback: function (p) {
                            return player.addStatsRow(tx, p, true);
                        }
                    });
                })
            ]);
        }).then(function () {
            return Promise.all([
                finances.assessPayrollMinLuxury(tx),
                season.newSchedulePlayoffsDay(tx)
            ]);
        }).then(function () {
            var url;

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
        return season.awards(tx).then(function () {
            // Add award for each player on the championship team
            return team.filter({
                ot: tx,
                attrs: ["tid"],
                seasonAttrs: ["playoffRoundsWon"],
                season: g.season
            });
        }).then(function (teams) {
            var i, tid;

            // Give award to all players on the championship team
            for (i = 0; i < teams.length; i++) {
                if (teams[i].playoffRoundsWon === 4) {
                    tid = teams[i].tid;
                    break;
                }
            }
            return dao.players.iterate({
                ot: tx,
                index: "tid",
                key: tid,
                callback: function (p) {
                    p.awards.push({season: g.season, type: "Won Championship"});
                    return p;
                }
            });
        }).then(function () {
            var maxAge, minPot;

            // Do annual tasks for each player, like checking for retirement

            // Players meeting one of these cutoffs might retire
            maxAge = 34;
            minPot = 40;

            return dao.players.iterate({
                ot: tx,
                index: "tid",
                key: IDBKeyRange.lowerBound(g.PLAYER.FREE_AGENT),
                callback: function (p) {
                    var update;

                    update = false;

                    // Get player stats, used for HOF calculation
                    return dao.playerStats.getAll({
                        ot: tx,
                        index: "pid, season, tid",
                        key: IDBKeyRange.bound([p.pid], [p.pid, ''])
                    }).then(function (playerStats) {
                        var age, excessAge, excessPot, pot;

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
                }
            });
        }).then(function () {
            // Remove released players' salaries from payrolls if their contract expired this year
            return dao.releasedPlayers.iterate({
                ot: tx,
                index: "contract.exp",
                key: IDBKeyRange.upperBound(g.season),
                callback: function (rp) {
                    dao.releasedPlayers.delete({
                        ot: tx,
                        key: rp.rid
                    });
                }
            });
        }).then(function () {
            return team.updateStrategies(tx);
        }).then(function () {
            return season.updateOwnerMood(tx);
        }).then(function (deltas) {
            return message.generate(tx, deltas);
        }).then(function () {
            var url;

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

        return draft.genOrder(tx).then(function () {
            // This is a hack to handle weird cases where players have draft.year set to the current season, which fucks up the draft UI
            return dao.players.iterate({
                ot: tx,
                index: "draft.year",
                key: g.season,
                callback: function (p) {
                    if (p.tid >= 0) {
                        p.draft.year -= 1;
                        return p;
                    }
                }
            });
        }).then(function () {
            return [helpers.leagueUrl(["draft"])];
        });
    }

    function newPhaseAfterDraft(tx) {
        var promises, round, tid;

        promises = [];

        // Add a new set of draft picks
        for (tid = 0; tid < g.numTeams; tid++) {
            for (round = 1; round <= 2; round++) {
                promises.push(dao.draftPicks.add({
                    ot: tx,
                    value: {
                        tid: tid,
                        originalTid: tid,
                        round: round,
                        season: g.season + 4
                    }
                }));
            }
        }

        return Promise.all(promises).then(function () {
            return [undefined, ["playerMovement"]];
        });
    }

    function newPhaseResignPlayers(tx) {
        return player.genBaseMoods(tx).then(function (baseMoods) {
            // Re-sign players on user's team, and some AI players
            return dao.players.iterate({
                ot: tx,
                index: "tid",
                key: IDBKeyRange.lowerBound(0),
                callback: function (p) {
                    if (p.contract.exp <= g.season && p.tid === g.userTid) {
                        // Add to free agents first, to generate a contract demand
                        return player.addToFreeAgents(tx, p, g.PHASE.RESIGN_PLAYERS, baseMoods).then(function () {
                            // Open negotiations with player
                            return contractNegotiation.create(tx, p.pid, true).then(function (error) {
                                if (error !== undefined && error) {
                                    eventLog.add(null, {
                                        type: "refuseToSign",
                                        text: error
                                    });
                                }
                            });
                        });
                    }
                }
            });
        }).then(function () {
            // Set daysLeft here because this is "basically" free agency, so some functions based on daysLeft need to treat it that way (such as the trade AI being more reluctant)
            require("core/league").setGameAttributes(null, {daysLeft: 30});

            return [helpers.leagueUrl(["negotiation"]), ["playerMovement"]];
        });
    }

    function newPhaseFreeAgency(tx) {
        var strategies;

        return team.filter({
            ot: tx,
            attrs: ["strategy"],
            season: g.season
        }).then(function (teams) {
            strategies = _.pluck(teams, "strategy");

            // Delete all current negotiations to resign players
            return contractNegotiation.cancelAll(tx);
        }).then(function () {
            return player.genBaseMoods(tx).then(function (baseMoods) {
                // Reset contract demands of current free agents and undrafted players
                return dao.players.iterate({
                    ot: tx,
                    index: "tid",
                    key: IDBKeyRange.bound(g.PLAYER.UNDRAFTED, g.PLAYER.FREE_AGENT), // This only works because g.PLAYER.UNDRAFTED is -2 and g.PLAYER.FREE_AGENT is -1
                    callback: function (p) {
                        return player.addToFreeAgents(tx, p, g.PHASE.FREE_AGENCY, baseMoods);
                    }
                }).then(function () {
                    // AI teams re-sign players or they become free agents
                    // Run this after upding contracts for current free agents, or addToFreeAgents will be called twice for these guys
                    return dao.players.iterate({
                        ot: tx,
                        index: "tid",
                        key: IDBKeyRange.lowerBound(0),
                        callback: function (p) {
                            var contract, factor;

                            if (p.contract.exp <= g.season && p.tid !== g.userTid) {
                                // Automatically negotiate with teams
                                if (strategies[p.tid] === "rebuilding") {
                                    factor = 0.4;
                                } else {
                                    factor = 0;
                                }

                                if (Math.random() < p.value / 100 - factor) { // Should eventually be smarter than a coin flip
                                    contract = player.genContract(p);
                                    contract.exp += 1; // Otherwise contracts could expire this season
                                    p = player.setContract(p, contract, true);
                                    p.gamesUntilTradable = 15;
                                    return p; // Other endpoints include calls to addToFreeAgents, which handles updating the database
                                }

                                return player.addToFreeAgents(tx, p, g.PHASE.RESIGN_PLAYERS, baseMoods);
                            }
                        }
                    });
                });
            }).then(function () {
                // Bump up future draft classes (nested so tid updates don't cause race conditions)
                return dao.players.iterate({
                    ot: tx,
                    index: "tid",
                    key: g.PLAYER.UNDRAFTED_2,
                    callback: function (p) {
                        p.tid = g.PLAYER.UNDRAFTED;
                        p.ratings[0].fuzz /= 2;
                        return p;
                    }
                }).then(function () {
                    return dao.players.iterate({
                        ot: tx,
                        index: "tid",
                        key: g.PLAYER.UNDRAFTED_3,
                        callback: function (p) {
                            p.tid = g.PLAYER.UNDRAFTED_2;
                            p.ratings[0].fuzz /= 2;
                            return p;
                        }
                    });
                });
            }).then(function () {
                // Create new draft class for 3 years in the future
                return draft.genPlayers(tx, g.PLAYER.UNDRAFTED_3);
            }).then(function () {
                return [helpers.leagueUrl(["free_agents"]), ["playerMovement"]];
            });
        });
    }

    function newPhaseFantasyDraft(tx, position) {
        return contractNegotiation.cancelAll(tx).then(function () {
            return draft.genOrderFantasy(tx, position);
        }).then(function () {
            return require("core/league").setGameAttributes(tx, {nextPhase: g.phase});
        }).then(function () {
            // Protect draft prospects from being included in this
            return dao.players.iterate({
                ot: tx,
                index: "tid",
                key: g.PLAYER.UNDRAFTED,
                callback: function (p) {
                    p.tid = g.PLAYER.UNDRAFTED_FANTASY_TEMP;
                    return p;
                }
            }).then(function () {
                // Make all players draftable
                dao.players.iterate({
                    ot: tx,
                    index: "tid",
                    key: IDBKeyRange.lowerBound(g.PLAYER.FREE_AGENT),
                    callback: function (p) {
                        p.tid = g.PLAYER.UNDRAFTED;
                        return p;
                    }
                });
            });
        }).then(function () {
            return dao.releasedPlayers.clear({ot: tx});
        }).then(function () {
            return [helpers.leagueUrl(["draft"]), ["playerMovement"]];
        });
    }

    /**
     * Set a new phase of the game.
     *
     * This function is called to do all the crap that must be done during transitions between phases of the game, such as moving from the regular season to the playoffs. Phases are defined in the g.PHASE.* global variables. The phase update may happen asynchronously if the database must be accessed, so do not rely on g.phase being updated immediately after this function is called. Instead, pass a callback.
     *
     * @memberOf core.phase
     * @param {number} phase Numeric phase ID. This should always be one of the g.PHASE.* variables defined in globals.js.
     * @param {} extra Parameter containing extra info to be passed to phase changing function. Currently only used for newPhaseFantasyDraft.
     * @return {Promise}
     */
    function newPhase(phase, extra) {
        var tx;

        // Prevent at least some cases of code running twice
        if (phase === g.phase) {
            return;
        }

        // Prevent new phase from being clicked twice by deleting all options from the play menu. The options will be restored after the new phase is set or if there is an error by calling ui.updatePlayMenu.
        g.vm.topMenu.options([]);

        return Promise.try(function () {
            if (phase === g.PHASE.PRESEASON) {
                tx = dao.tx(["gameAttributes", "players", "playerStats", "releasedPlayers", "teams"], "readwrite");
                return newPhasePreseason(tx);
            }
            if (phase === g.PHASE.REGULAR_SEASON) {
                tx = dao.tx(["gameAttributes", "messages", "schedule"], "readwrite");
                return newPhaseRegularSeason(tx);
            }
            if (phase === g.PHASE.AFTER_TRADE_DEADLINE) {
                return newPhaseAfterTradeDeadline();
            }
            if (phase === g.PHASE.PLAYOFFS) {
                tx = dao.tx(["players", "playerStats", "playoffSeries", "releasedPlayers", "schedule", "teams"], "readwrite");
                return newPhasePlayoffs(tx);
            }
            if (phase === g.PHASE.BEFORE_DRAFT) {
                tx = dao.tx(["awards", "events", "gameAttributes", "messages", "players", "playerStats", "releasedPlayers", "teams"], "readwrite");
                return newPhaseBeforeDraft(tx);
            }
            if (phase === g.PHASE.DRAFT) {
                tx = dao.tx(["draftPicks", "draftOrder", "players", "teams"], "readwrite");
                return newPhaseDraft(tx);
            }
            if (phase === g.PHASE.AFTER_DRAFT) {
                tx = dao.tx("draftPicks", "readwrite");
                return newPhaseAfterDraft(tx);
            }
            if (phase === g.PHASE.RESIGN_PLAYERS) {
                tx = dao.tx(["gameAttributes", "messages", "negotiations", "players", "teams"], "readwrite");
                return newPhaseResignPlayers(tx);
            }
            if (phase === g.PHASE.FREE_AGENCY) {
                tx = dao.tx(["gameAttributes", "messages", "negotiations", "players", "teams"], "readwrite");
                return newPhaseFreeAgency(tx);
            }
            if (phase === g.PHASE.FANTASY_DRAFT) {
                tx = dao.tx(["draftOrder", "gameAttributes", "messages", "negotiations", "players", "releasedPlayers"], "readwrite");
                return newPhaseFantasyDraft(tx, extra);
            }
        }).catch(function (err) {
            // If there was any error in the phase change, abort transaction
            tx.abort();
            throw err;
        }).spread(function (url, updateEvents) {
            return tx.complete().then(function () {
                return finalize(phase, url, updateEvents);
            });
        });
    }

    return {
        newPhase: newPhase
    };
});