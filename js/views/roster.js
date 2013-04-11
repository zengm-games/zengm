/**
 * @name views.gameLog
 * @namespace Current or historical rosters for every team. Current roster for user's team is editable.
 */
define(["api", "db", "globals", "ui", "lib/davis", "lib/jquery", "views/components", "util/helpers", "util/viewHelpers"], function (api, db, g, ui, Davis, $, components, helpers, viewHelpers) {
    "use strict";

    var vm;

    function update(tid, season, updateEvents, cb) {
        var attributes, currentSeason, ratings, sortable, stats, transaction;

        sortable = false;

        transaction = g.dbl.transaction(["players", "releasedPlayers", "schedule", "teams"]);

        // Run after players are loaded
        function cbAfterPlayers(players, payroll) {
            if (players.length > 5) {
                players[4].separator = true;
            }

            transaction.objectStore("teams").get(tid).onsuccess = function (event) {
                var data, j, team, teamAll, teamSeason;

                teamAll = event.target.result;
                for (j = 0; j < teamAll.seasons.length; j++) {
                    if (teamAll.seasons[j].season === season) {
                        teamSeason = teamAll.seasons[j];
                        break;
                    }
                }
                team = {region: teamAll.region, name: teamAll.name, abbrev: teamAll.abbrev, cash: teamSeason.cash / 1000};

                for (j = 0; j < players.length; j++) {
                    if (players.length > 5) {
                        players[j].canRelease = true;
                        if (players[j].cashOwed <= team.cash) {
                            players[j].canBuyOut = true;
                        }
                    }
                }

                data = {
                    container: "league_content",
                    template: "roster",
                    title: team.region + " " + team.name + " " + "Roster - " + season,
                    vars: {season: season, sortable: sortable, currentSeason: currentSeason, showTradeFor: currentSeason && tid !== g.userTid, players: players, numRosterSpots: 15 - players.length, team: team, payroll: payroll, salaryCap: g.salaryCap / 1000}
                };
                ui.update(data, function () {
                    var fixHelper, highlightHandles;

                    ui.dropdown($("#roster-select-team"), $("#roster-select-season"));

                    if (sortable) {
                        // Roster reordering
                        highlightHandles = function () {
                            var i;

                            i = 1;
                            $("#roster tbody").children().each(function () {
                                var tr;

                                tr = $(this);
                                if (i <= 5) {
                                    tr.find("td:first").removeClass("btn-info").addClass("btn-primary");
                                } else {
                                    tr.find("td:first").removeClass("btn-primary").addClass("btn-info");
                                }
                                if (i === 5) {
                                    tr.addClass("separator");
                                } else {
                                    tr.removeClass("separator");
                                }
                                i++;
                            });
                        };
                        highlightHandles();
                        fixHelper = function (e, ui) {
                            // Return helper which preserves the width of table cells being reordered
                            ui.children().each(function () {
                                $(this).width($(this).width());
                            });
                            return ui;
                        };
                        $("#roster tbody").sortable({
                            helper: fixHelper,
                            cursor: "move",
                            update: function (e, ui) {
                                var i, sortedPids;

                                sortedPids = $(this).sortable("toArray");
                                for (i = 0; i < sortedPids.length; i++) {
                                    sortedPids[i] = parseInt(sortedPids[i].substr(7), 10);
                                }

                                api.rosterReorder(sortedPids, function () {
                                    highlightHandles();
                                });
                            }
                        }).disableSelection();
                        $("#roster-auto-sort").click(function (event) {
                            api.rosterAutoSort();
                        });

                        // Release player
                        $("#roster button").click(function (event) {
                            var tr;

                            if (this.dataset.action === "release") {
                                if (window.confirm("Are you sure you want to release " + this.dataset.playerName + "?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in " + this.dataset.contractExpiration + ".")) {
                                    tr = this.parentNode.parentNode;
                                    api.rosterRelease(this.dataset.playerId, function (error) {
                                        if (error) {
                                            alert("Error: " + error);
                                        } else {
                                            Davis.location.assign(new Davis.Request(Davis.location.current()));
                                        }
                                    });
                                }
                            } else if (this.dataset.action === "buyOut") {
                                if (team.cash > this.dataset.cashOwed) {
                                    if (window.confirm("Are you sure you want to buy out " + this.dataset.playerName + "? You will have to pay him the $" + this.dataset.cashOwed + "M remaining on his contract from your current cash reserves of " + helpers.formatCurrency(team.cash, "M") + ". He will then become a free agent and his contract will no longer count towards your salary cap.")) {
                                        tr = this.parentNode.parentNode;
                                        api.rosterBuyOut(this.dataset.playerId, function (error) {
                                            if (error) {
                                                alert("Error: " + error);
                                            } else {
                                                Davis.location.assign(new Davis.Request(Davis.location.current()));
                                            }
                                        });
                                    }
                                } else {
                                    alert("Error: You only have " + helpers.formatCurrency(team.cash, "M") + " in cash, but it would take $" + this.dataset.cashOwed + "M to buy out " + this.dataset.playerName + ".");
                                }
                            }/* else if (this.dataset.action === "tradeFor") {

                            }*/
                        });
                    }

                    if (cb !== undefined) {
                        cb();
                    }
                });
            };
        }

        attributes = ["pid", "name", "pos", "age", "contract", "cashOwed", "rosterOrder", "injury"];
        ratings = ["ovr", "pot", "skills"];
        stats = ["min", "pts", "trb", "ast", "per"];

        if (season === g.season) {
            // Show players currently on the roster
            currentSeason = true;

            if (tid === g.userTid) {
                sortable = true;
            }
            transaction.objectStore("schedule").getAll().onsuccess = function (event) {
                var i, numGamesRemaining, schedule;

                // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
                schedule = event.target.result;
                numGamesRemaining = 0;
                for (i = 0; i < schedule.length; i++) {
                    if (tid === schedule[i].homeTid || tid === schedule[i].awayTid) {
                        numGamesRemaining += 1;
                    }
                }

                transaction.objectStore("players").index("tid").getAll(tid).onsuccess = function (event) {
                    var i, players;

                    players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: numGamesRemaining, showRookies: true, sortBy: "rosterOrder", showNoStats: true, fuzz: true});

                    db.getPayroll(transaction, tid, function (payroll) {
                        cbAfterPlayers(players, payroll / 1000);
                    });
                };
            };
        } else {
            // Show all players with stats for the given team and year
            currentSeason = false;
            transaction.objectStore("players").index("statsTids").getAll(tid).onsuccess = function (event) {
                var i, players;

                players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: 0, showRookies: true, sortBy: "rosterOrder", fuzz: true});

                // Fix ages
                for (i = 0; i < players.length; i++) {
                    players[i].age = players[i].age - (g.season - season);
                }

                cbAfterPlayers(players, null);
            };
        }
    }

    function get(req) {
        // Fix broken links
        if (req.params.abbrev === "FA") {
            return Davis.location.assign(new Davis.Request("/l/" + g.lid + "/free_agents"));
        }

        viewHelpers.beforeLeague(req, function () {
            var out, season, tid, updateEvents;

            out = helpers.validateAbbrev(req.params.abbrev);
            tid = out[0];
            season = helpers.validateSeason(req.params.season);
            updateEvents = req.raw.updateEvents !== undefined ? req.raw.updateEvents : [];

            update(tid, season, updateEvents, req.raw.cb);
        });
    }

    return {
        get: get
    };
});