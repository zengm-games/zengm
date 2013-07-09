/**
 * @name core.team
 * @namespace Functions operating on team objects, parts of team objects, or arrays of team objects.
 */
define(["db", "globals", "core/player", "lib/underscore", "util/helpers", "util/random"], function (db, g, player, _, helpers, random) {
    "use strict";

    /**
     * Add a new row of season attributes to a team object.
     * 
     * There should be one season attributes row for each year, and a new row should be added for each team at the start of a season.
     *
     * @memberOf core.team
     * @param {Object} t Team object.
     * @return {Object} Updated team object.
     */
    function addSeasonRow(t) {
        var key, newSeason, s;

        s = t.seasons.length - 1; // Most recent ratings

        // Initial entry
        newSeason = {
            season: g.season,
            gp: 0,
            att: 0,
            cash: 10000,
            won: 0,
            lost: 0,
            wonHome: 0,
            lostHome: 0,
            wonAway: 0,
            lostAway: 0,
            wonDiv: 0,
            lostDiv: 0,
            wonConf: 0,
            lostConf: 0,
            lastTen: [],
            streak: 0,
            playoffRoundsWon: -1,  // -1: didn't make playoffs. 0: lost in first round. ... 4: won championship
            hype: Math.random(),
            pop: 0,  // Needs to be set somewhere!
            tvContract: {
                amount: 0,
                exp: 0
            },
            revenues: {
                merch: {
                    amount: 0,
                    rank: 15.5
                },
                sponsor: {
                    amount: 0,
                    rank: 15.5
                },
                ticket: {
                    amount: 0,
                    rank: 15.5
                },
                nationalTv: {
                    amount: 0,
                    rank: 15.5
                },
                localTv: {
                    amount: 0,
                    rank: 15.5
                }
            },
            expenses: {
                salary: {
                    amount: 0,
                    rank: 15.5
                },
                luxuryTax: {
                    amount: 0,
                    rank: 15.5
                },
                minTax: {
                    amount: 0,
                    rank: 15.5
                },
                buyOuts: {
                    amount: 0,
                    rank: 15.5
                },
                scouting: {
                    amount: 0,
                    rank: 15.5
                },
                coaching: {
                    amount: 0,
                    rank: 15.5
                },
                health: {
                    amount: 0,
                    rank: 15.5
                },
                facilities: {
                    amount: 0,
                    rank: 15.5
                }
            },
            payrollEndOfSeason: -1
        };

        if (s >= 0) {
            // New season, carrying over some values from the previous season
            newSeason.pop = t.seasons[s].pop * random.uniform(0.98, 1.02);  // Mean population should stay constant, otherwise the economics change too much
            newSeason.hype = t.seasons[s].hype;
            newSeason.cash = t.seasons[s].cash;
            newSeason.tvContract = t.seasons[s].tvContract;
        }

        t.seasons.push(newSeason);

        return t;
    }

    /**
     * Add a new row of stats to a team object.
     * 
     * A row contains stats for unique values of (season, playoffs). So new rows need to be added when a new season starts or when a team makes the playoffs.
     *
     * @memberOf core.team
     * @param {Object} t Team object.
     * @param {=boolean} playoffs Is this stats row for the playoffs or not? Default false.
     * @return {Object} Updated team object.
     */
    function addStatsRow(t, playoffs) {
        var key, newStats;

        playoffs = playoffs !== undefined ? playoffs : false;

        t.stats.push({
            season: g.season,
            playoffs: playoffs,
            gp: 0,
            min: 0,
            fg: 0,
            fga: 0,
            fgAtRim: 0,
            fgaAtRim: 0,
            fgLowPost: 0,
            fgaLowPost: 0,
            fgMidRange: 0,
            fgaMidRange: 0,
            tp: 0,
            tpa: 0,
            ft: 0,
            fta: 0,
            orb: 0,
            drb: 0,
            trb: 0,
            ast: 0,
            tov: 0,
            stl: 0,
            blk: 0,
            pf: 0,
            pts: 0,
            oppPts: 0
        });

        return t;
    }

    /**
     * Create a new team object.
     * 
     * @memberOf core.team
     * @param {Object} tm Team metadata object, likely from util.helpers.getTeams.
     * @return {Object} Team object to insert in the database.
     */
    function generate(tm) {
        var t;

        t = {
            tid: tm.tid,
            cid: tm.cid,
            did: tm.did,
            region: tm.region,
            name: tm.name,
            abbrev: tm.abbrev,
            stats: [],
            seasons: [],
            budget: {
                ticketPrice: {
                    amount: helpers.round(25 + 25 * (30 - tm.popRank) / 29, 2),
                    rank: tm.popRank
                },
                scouting: {
                    amount: helpers.round(900 + 900 * (30 - tm.popRank) / 29) * 10,
                    rank: tm.popRank
                },
                coaching: {
                    amount: helpers.round(900 + 900 * (30 - tm.popRank) / 29) * 10,
                    rank: tm.popRank
                },
                health: {
                    amount: helpers.round(900 + 900 * (30 - tm.popRank) / 29) * 10,
                    rank: tm.popRank
                },
                facilities: {
                    amount: helpers.round(900 + 900 * (30 - tm.popRank) / 29) * 10,
                    rank: tm.popRank
                }
            }
        };

        t = addSeasonRow(t);
        t = addStatsRow(t);

        t.seasons[0].pop = tm.pop;

        return t;
    }

    /**
     * Sort a team's roster based on player ratings.
     *
     * If ot is null, then the callback will run only after the transaction finishes (i.e. only after the updated roster order is actually saved to the database). If ot is not null, then the callback might run earlier, so don't rely on the updated roster order actually being in the database yet.
     *
     * So, ot should NOT be null if you're sorting multiple roster as a component of some larger operation, but the results of the sorts don't actually matter. ot should be null if you need to ensure that the roster order is updated before you do something that will read the roster order (like updating the UI).
     * 
     * @memberOf core.team
     * @param {(IDBObjectStore|IDBTransaction|null)} ot An IndexedDB object store or transaction on players readwrite; if null is passed, then a new transaction will be used.
     * @param {number} tid Team ID.
     * @param {function()=} cb Optional callback.
     */
    function rosterAutoSort(ot, tid, cb) {
        var players, playerStore, tx;

        tx = db.getObjectStore(ot, "players", null, true);
        playerStore = tx.objectStore("players");

        // Get roster and sort by overall rating
        playerStore.index("tid").getAll(tid).onsuccess = function (event) {
            var i;

            players = player.filter(event.target.result, {
                attrs: ["pid"],
                ratings: ["ovr"],
                season: g.season,
                tid: tid,
                showNoStats: true,
                showRookies: true,
                fuzz: tid === g.userTid
            });
            players.sort(function (a, b) {  return b.ratings.ovr - a.ratings.ovr; });

            for (i = 0; i < players.length; i++) {
                players[i].rosterOrder = i;
            }

            // Update rosterOrder
            playerStore.index("tid").openCursor(tid).onsuccess = function (event) {
                var cursor, i, p;

                cursor = event.target.result;
                if (cursor) {
                    p = cursor.value;
                    for (i = 0; i < players.length; i++) {
                        if (players[i].pid === p.pid) {
                            p.rosterOrder = players[i].rosterOrder;
                            break;
                        }
                    }
                    cursor.update(p);
                    cursor.continue();
                }
            };

            if (ot !== null) {
                // This function doesn't have its own transaction, so we need to call the callback now even though the update might not have been processed yet.
                if (cb !== undefined) {
                    cb();
                }
            }
        };

        if (ot === null) {
            // This function has its own transaction, so wait until it finishes before calling the callback.
            tx.oncomplete = function () {
                if (cb !== undefined) {
                    cb();
                }
            };
        }
    }

    /**
     * Retrieve a filtered team object (or an array of player objects) from the database by removing/combining/processing some components.
     *
     * This can be used to retrieve information about a certain season, compute average statistics from the raw data, etc.
     *
     * This is similar to player.filter, but has some differences. If only one season is requested, the attrs, seasonAttrs, and stats properties will all be merged on the root filtered team object for each team. "stats" is broken out into its own property only when multiple seasons are requested (options.season is undefined). "seasonAttrs" should behave similarly, but it currently doesn't because it just hasn't been used that way anywhere yet.
     * 
     * @memberOf core.team
     * @param {Object} options Options, as described below.
     * @param {number=} options.season Season to retrieve stats/ratings for. If undefined, return stats for all seasons in a list called "stats".
     * @param {number=} options.tid Team ID. Set this if you want to return only one team object. If undefined, an array of all teams is returned.
     * @param {Array.<string>=} options.attrs List of team attributes to include in output (e.g. region, abbrev, name, ...).
     * @param {Array.<string>=} options.seasonAttrs List of seasonal team attributes to include in output (e.g. won, lost, payroll, ...).
     * @param {Array.<string=>} options.stats List of team stats to include in output (e.g. fg, orb, ast, blk, ...).
     * @param {boolean=} options.totals Boolean representing whether to return total stats (true) or per-game averages (false); default is false.
     * @param {boolean=} options.playoffs Boolean representing whether to return playoff stats or not; default is false. Unlike player.filter, team.filter returns either playoff stats or regular season stats, never both.
     * @param {string=} options.sortby Sorting method. "winp" sorts by descending winning percentage. If undefined, then teams are returned in order of their team IDs (which is alphabetical, currently).
     * @param {IDBTransaction|null=} options.ot An IndexedDB transaction on players, releasedPlayers, and teams; if null/undefined, then a new transaction will be used.
     * @param {function(Object|Array.<Object>)} cb Callback function called with filtered team object or array of filtered team objects, depending on the inputs.
     */
    function filter(options, cb) {
        var filterAttrs, filterSeasonAttrs, filterStats, filterStatsPartial, tx;

        options = options !== undefined ? options : {};
        options.season = options.season !== undefined ? options.season : null;
        options.tid = options.tid !== undefined ? options.tid : null;
        options.attrs = options.attrs !== undefined ? options.attrs : [];
        options.seasonAttrs = options.seasonAttrs !== undefined ? options.seasonAttrs : [];
        options.stats = options.stats !== undefined ? options.stats : [];
        options.totals = options.totals !== undefined ? options.totals : false;
        options.playoffs = options.playoffs !== undefined ? options.playoffs : false;
        options.sortBy = options.sortBy !== undefined ? options.sortBy : "";

        // Copys/filters the attributes listed in options.attrs from p to fp.
        filterAttrs = function (ft, t, options) {
            var j;

            for (j = 0; j < options.attrs.length; j++) {
                if (options.attrs[j] === "budget") {
                    ft.budget = helpers.deepCopy(t.budget);
                    _.each(ft.budget, function (value, key) {
                        if (key !== "ticketPrice") {  // ticketPrice is the only thing in dollars always
                            value.amount /= 1000;
                        }
                    });
                } else {
                    ft[options.attrs[j]] = t[options.attrs[j]];
                }
            }
        };

        // Copys/filters the seasonal attributes listed in options.seasonAttrs from p to fp.
        filterSeasonAttrs = function (ft, t, options) {
            var j, lastTenLost, lastTenWon, tsa;

            if (options.seasonAttrs.length > 0) {
                for (j = 0; j < t.seasons.length; j++) {
                    if (t.seasons[j].season === options.season) {
                        tsa = t.seasons[j];
                        break;
                    }
                }

                // Revenue and expenses calculation
                tsa.revenue = _.reduce(tsa.revenues, function (memo, revenue) { return memo + revenue.amount; }, 0);
                tsa.expense = _.reduce(tsa.expenses, function (memo, expense) { return memo + expense.amount; }, 0);

                for (j = 0; j < options.seasonAttrs.length; j++) {
                    if (options.seasonAttrs[j] === "winp") {
                        ft.winp = 0;
                        if (tsa.won + tsa.lost > 0) {
                            ft.winp = tsa.won / (tsa.won + tsa.lost);
                        }
                    } else if (options.seasonAttrs[j] === "att") {
                        ft.att = 0;
                        if (tsa.gp > 0) {
                            ft.att = tsa.att / tsa.gp;
                        }
                    } else if (options.seasonAttrs[j] === "cash") {
                        ft.cash = tsa.cash / 1000;  // [millions of dollars]
                    } else if (options.seasonAttrs[j] === "revenue") {
                        ft.revenue = tsa.revenue / 1000;  // [millions of dollars]
                    } else if (options.seasonAttrs[j] === "profit") {
                        ft.profit = (tsa.revenue - tsa.expense) / 1000;  // [millions of dollars]
                    } else if (options.seasonAttrs[j] === "salaryPaid") {
                        ft.salaryPaid = tsa.expenses.salary.amount / 1000;  // [millions of dollars]
                    } else if (options.seasonAttrs[j] === "payroll") {
                        // Handled later
                        ft.payroll = null;
                    } else if (options.seasonAttrs[j] === "lastTen") {
                        lastTenWon = _.reduce(tsa.lastTen, function (memo, num) { return memo + num; }, 0);
                        lastTenLost = tsa.lastTen.length - lastTenWon;
                        ft.lastTen = lastTenWon + "-" + lastTenLost;
                    } else if (options.seasonAttrs[j] === "streak") {  // For standings
                        if (tsa.streak === 0) {
                            ft.streak = "None";
                        } else if (tsa.streak > 0) {
                            ft.streak = "Won " + tsa.streak;
                        } else if (tsa.streak < 0) {
                            ft.streak = "Lost " + Math.abs(tsa.streak);
                        }
                    } else if (options.seasonAttrs[j] === "streakLong") {  // For dashboard
                        if (tsa.streak === 0) {
                            ft.streakLong = null;
                        } else if (tsa.streak === 1) {
                            ft.streakLong = "won last game";
                        } else if (tsa.streak > 1) {
                            ft.streakLong = "won last " + tsa.streak + " games";
                        } else if (tsa.streak === -1) {
                            ft.streakLong = "lost last game";
                        } else if (tsa.streak < -1) {
                            ft.streakLong = "lost last " + Math.abs(tsa.streak) + " games";
                        }
                    } else {
                        ft[options.seasonAttrs[j]] = tsa[options.seasonAttrs[j]];
                    }
                }
            }
        };

        // Filters s by stats (which should be options.stats) into ft. This is to do one season of stats filtering.
        filterStatsPartial = function (ft, s, stats) {
            var j;

            if (s !== undefined && s.gp > 0) {
                for (j = 0; j < stats.length; j++) {
                    if (stats[j] === "gp") {
                        ft.gp = s.gp;
                    } else if (stats[j] === "fgp") {
                        if (s.fga > 0) {
                            ft.fgp = 100 * s.fg / s.fga;
                        } else {
                            ft.fgp = 0;
                        }
                    } else if (stats[j] === "fgpAtRim") {
                        if (s.fgaAtRim > 0) {
                            ft.fgpAtRim = 100 * s.fgAtRim / s.fgaAtRim;
                        } else {
                            ft.fgpAtRim = 0;
                        }
                    } else if (stats[j] === "fgpLowPost") {
                        if (s.fgaLowPost > 0) {
                            ft.fgpLowPost = 100 * s.fgLowPost / s.fgaLowPost;
                        } else {
                            ft.fgpLowPost = 0;
                        }
                    } else if (stats[j] === "fgpMidRange") {
                        if (s.fgaMidRange > 0) {
                            ft.fgpMidRange = 100 * s.fgMidRange / s.fgaMidRange;
                        } else {
                            ft.fgpMidRange = 0;
                        }
                    } else if (stats[j] === "tpp") {
                        if (s.tpa > 0) {
                            ft.tpp = 100 * s.tp / s.tpa;
                        } else {
                            ft.tpp = 0;
                        }
                    } else if (stats[j] === "ftp") {
                        if (s.fta > 0) {
                            ft.ftp = 100 * s.ft / s.fta;
                        } else {
                            ft.ftp = 0;
                        }
                    } else if (stats[j] === "season") {
                        ft.season = s.season;
                    } else {
                        if (options.totals) {
                            ft[stats[j]] = s[stats[j]];
                        } else {
                            ft[stats[j]] = s[stats[j]] / s.gp;
                        }
                    }
                }
            } else {
                for (j = 0; j < stats.length; j++) {
                    if (stats[j] === "season") {
                        ft.season = s.season;
                    } else {
                        ft[stats[j]] = 0;
                    }
                }
            }

            return ft;
        };

        // Copys/filters the stats listed in options.stats from p to fp.
        filterStats = function (ft, t, options) {
            var i, j, ts;

            if (options.stats.length > 0) {
                if (options.season !== null) {
                    // Single season
                    for (j = 0; j < t.stats.length; j++) {
                        if (t.stats[j].season === options.season && t.stats[j].playoffs === options.playoffs) {
                            ts = t.stats[j];
                            break;
                        }
                    }
                } else {
                    // Multiple seasons
                    ts = [];
                    for (j = 0; j < t.stats.length; j++) {
                        if (t.stats[j].playoffs === options.playoffs) {
                            ts.push(t.stats[j]);
                        }
                    }
                }
            }

            if (ts !== undefined && ts.length >= 0) {
                ft.stats = [];
                // Multiple seasons
                for (i = 0; i < ts.length; i++) {
                    ft.stats.push(filterStatsPartial({}, ts[i], options.stats));
                }
            } else {
                // Single seasons - merge stats with root object
                ft = filterStatsPartial(ft, ts, options.stats);
            }
        };

        tx = db.getObjectStore(options.ot, ["players", "releasedPlayers", "teams"], null);
        tx.objectStore("teams").getAll(options.tid).onsuccess = function (event) {
            var ft, fts, i, returnOneTeam, savePayroll, t;

            t = event.target.result;

            // t will be an array of 30 teams (if options.tid is null) or an array of 1 team. If 1, then we want to return just that team object at the end, not an array of 1 team.
            returnOneTeam = false;
            if (t.length === 1) {
                returnOneTeam = true;
            }

            fts = [];

            for (i = 0; i < t.length; i++) {
                ft = {};
                filterAttrs(ft, t[i], options);
                filterSeasonAttrs(ft, t[i], options);
                filterStats(ft, t[i], options);
                fts.push(ft);
            }

            if (options.sortBy === "winp") {
                // Sort by winning percentage, descending
                fts.sort(function (a, b) {  return b.winp - a.winp; });
            }

            // If payroll for the current season was requested, find the current payroll for each team. Otherwise, don't.
            if (options.seasonAttrs.indexOf("payroll") < 0 || options.season !== g.season) {
                cb(returnOneTeam ? fts[0] : fts);
            } else {
                savePayroll = function (i) {
                    db.getPayroll(options.ot, t[i].tid, function (payroll) {
                        fts[i].payroll = payroll / 1000;
                        if (i === fts.length - 1) {
                            cb(returnOneTeam ? fts[0] : fts);
                        } else {
                            savePayroll(i + 1);
                        }
                    });
                };
                savePayroll(0);
            }
        };
    }

    function valueChange(tid, pidsAdd, pidsRemove, cb) {
        var add, i, remove, roster, tx;

        // Get value and skills for each player on team or involved in the proposed transaction
        roster = [];
        add = [];
        remove = [];
        tx = g.dbl.transaction("players");
        tx.objectStore("players").index("tid").openCursor(tid).onsuccess = function (event) {
            var cursor, p;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;

                if (pidsRemove.indexOf(p.pid) < 0) {
                    roster.push({
                        value: player.value(p),
                        skills: _.last(p.ratings).skills,
                        contractAmount: p.contract.amount / 1000,
                        age: g.season - p.born.year
                    });
                } else {
                    remove.push({
                        value: player.value(p),
                        skills: _.last(p.ratings).skills,
                        contractAmount: p.contract.amount / 1000,
                        age: g.season - p.born.year
                    });
                }

                cursor.continue();
            }
        };
        for (i = 0; i < pidsAdd.length; i++) {
            tx.objectStore("players").get(pidsAdd[i]).onsuccess = function (event) {
                var p;

                p = event.target.result;

                add.push({
                    value: player.value(p),
                    skills: _.last(p.ratings).skills,
                    contractAmount: p.contract.amount / 1000,
                    age: g.season - p.born.year
                });
            };
        }

        tx.oncomplete = function () {
            var calcDv, doSkillBonuses, dv, rosterAndAdd, rosterAndRemove, skillsNeeded;

            // This roughly corresponds with core.gameSim.updateSynergy
            skillsNeeded = {
                "3": 5,
                A: 5,
                B: 3,
                Di: 2,
                Dp: 2,
                Po: 2,
                Ps: 4,
                R: 3
            };

            doSkillBonuses = function (test, roster) {
                var i, j, rosterSkills, rosterSkillsCount, s;

                // What are current skills?
                rosterSkills = [];
                for (i = 0; i < roster.length; i++) {
                    if (roster.value >= 45) {
                        rosterSkills.push(roster[i].skills);
                    }
                }
                rosterSkills = _.flatten(rosterSkills);
                rosterSkillsCount = _.countBy(rosterSkills);

                // Sort test by value, so that the highest value players get bonuses applied first
                test.sort(function (a, b) { return b.value - a.value; });

                for (i = 0; i < test.length; i++) {
                    if (test.value >= 45) {
                        for (j = 0; j < test[i].skills.length; j++) {
                            s = test[i].skills[j];

                            if (rosterSkills[s] <= skillsNeeded[s] - 2) {
                                // Big bonus
                                test.value *= 1.1;
                            } else if (rosterSkills[s] <= skillsNeeded[s] - 1) {
                                // Medium bonus
                                test.value *= 1.05;
                            } else if (rosterSkills[s] <= skillsNeeded[s]) {
                                // Little bonus
                                test.value *= 1.025;
                            }

                            // Account for redundancy in test
                            rosterSkills[s] += 1;
                        }
                    }
                }

                return test;
            };

            // Apply bonuses based on skills coming in and leaving
            rosterAndRemove = roster.concat(remove);
            rosterAndAdd = roster.concat(add);
            add = doSkillBonuses(add, rosterAndRemove);
            remove = doSkillBonuses(remove, rosterAndAdd);

            // Actually calculate the change in value
            calcDv = function (players) {
                return _.reduce(players, function (memo, player) {
                    var factors, pop;

                    // If the population of the region is larger, the contract size becomes less important. So factors.contract should increase
                    pop = helpers.getTeams()[tid].pop;
                    if (pop > 20) {
                        pop = 20;
                    }

                    factors = {
                        value: 0.3 * player.value,
                        // This is a straight line from ($0.5, 1.4) to ($20M, 0.1) - higher second coordinate means greater value
                        //contract: (20 - player.contractAmount) / 15 + 0.1
                        // This takes that straight line and roughly rotates it around the middle to make it more horizontal
                        contract: (20 - player.contractAmount) / (15 * Math.sqrt(pop)) + (-0.12 + Math.sqrt(pop) / Math.sqrt(20))
                    };

                    return memo + Math.pow(3, factors.value) * factors.contract;
                }, 0);
            };

/*console.log('---');
console.log(calcDv(add));
console.log(add);
console.log(calcDv(remove));
console.log(remove);*/
            dv = calcDv(add) - calcDv(remove);

            // Normalize for number of players, since 1 really good player is much better than multiple mediocre ones
            if (add.length > remove.length) {
                dv *= Math.pow(0.95, add.length - remove.length);
            }

            cb(dv)
        };
    }

    return {
        addSeasonRow: addSeasonRow,
        addStatsRow: addStatsRow,
        generate: generate,
        rosterAutoSort: rosterAutoSort,
        filter: filter,
        valueChange: valueChange
    };
});