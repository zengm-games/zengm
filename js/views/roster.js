/**
 * @name views.gameLog
 * @namespace Current or historical rosters for every team. Current roster for user's team is editable.
 */
define(["api", "db", "globals", "ui", "lib/davis", "lib/knockout", "lib/knockout.mapping", "lib/jquery", "views/components", "util/helpers", "util/viewHelpers"], function (api, db, g, ui, Davis, ko, mapping, $, components, helpers, viewHelpers) {
    "use strict";

    var vm;

    function highlightHandles() {
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
    }

    function editableChanged(editable) {
        var rosterTbody;

        rosterTbody = $("#roster tbody");

        if (!rosterTbody.is(":ui-sortable")) {
            // The first time editableChanged is called, set up sorting, but disable it by default
            $("#roster tbody").sortable({
                helper: function (e, ui) {
                    // Return helper which preserves the width of table cells being reordered
                    ui.children().each(function () {
                        $(this).width($(this).width());
                    });
                    return ui;
                },
                cursor: "move",
                update: function (e, ui) {
                    var i, sortedPids;

                    sortedPids = $(this).sortable("toArray", {attribute: "data-pid"});
                    for (i = 0; i < sortedPids.length; i++) {
                        sortedPids[i] = parseInt(sortedPids[i], 10);
                    }

                    api.rosterReorder(sortedPids, function () {
                        highlightHandles();
                    });
                },
                disabled: true
            });

            // Release and Buy Out buttons, which will only appear if the roster is editable
            $("#roster button").click(function (event) {
                var i, pid, players, tr;

                pid = parseInt(this.parentNode.parentNode.dataset.pid, 10);
                players = vm.players();
                for (i = 0; i < players.length; i++) {
                    if (players[i].pid() === pid) {
                        break;
                    }
                }

                if (this.dataset.action === "release") {
                    if (window.confirm("Are you sure you want to release " + players[i].name() + "?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in " + players[i].contract.exp() + ".")) {
                        tr = this.parentNode.parentNode;
                        api.rosterRelease(pid, function (error) {
                            if (error) {
                                alert("Error: " + error);
                            } else {
                                ui.realtimeUpdate(["playerMovement"]);
                            }
                        });
                    }
                } else if (this.dataset.action === "buyOut") {
                    if (vm.team.cash() > players[i].cashOwed()) {
                        if (window.confirm("Are you sure you want to buy out " + players[i].name() + "? You will have to pay him the " + helpers.formatCurrency(players[i].cashOwed(), "M") + " remaining on his contract from your current cash reserves of " + helpers.formatCurrency(vm.team.cash(), "M") + ". He will then become a free agent and his contract will no longer count towards your salary cap.")) {
                            tr = this.parentNode.parentNode;
                            api.rosterBuyOut(pid, function (error) {
                                if (error) {
                                    alert("Error: " + error);
                                } else {
                                    ui.realtimeUpdate(["playerMovement"]);
                                }
                            });
                        }
                    } else {
                        alert("Error: You only have " + helpers.formatCurrency(vm.team.cash(), "M") + " in cash, but it would take $" + this.dataset.cashOwed + "M to buy out " + this.dataset.playerName + ".");
                    }
                }
            });

            $("#roster-auto-sort").click(function (event) {
                vm.players([]); // This is a hack to force a UI update because the jQuery UI sortable roster reordering does not update the view model, which can cause the view model to think the roster is sorted correctly when it really isn't. (Example: load the roster, auto sort, reload, drag reorder it, auto sort -> the auto sort doesn't update the UI.)
                api.rosterAutoSort();
            });
        }

        if (editable) {
            rosterTbody.sortable("enable").disableSelection();
        } else {
            rosterTbody.sortable("disable").enableSelection();
        }
    }

    // We need to update, so first do all the stuff common to every type of update
    function loadBefore(abbrev, tid, season, cb) {
        var tx;
console.log("loadBefore")

        tx = g.dbl.transaction(["players", "releasedPlayers", "schedule", "teams"]);

        tx.objectStore("teams").get(tid).onsuccess = function (event) {
            var attributes, editable, i, ratings, stats, team, teamAll;

            teamAll = event.target.result;
            for (i = 0; i < teamAll.seasons.length; i++) {
                if (teamAll.seasons[i].season === season) {
                    break;
                }
            }
            team = {region: teamAll.region, name: teamAll.name, cash: teamAll.seasons[i].cash / 1000};

            attributes = ["pid", "name", "pos", "age", "contract", "cashOwed", "rosterOrder", "injury"];
            ratings = ["ovr", "pot", "skills"];
            stats = ["min", "pts", "trb", "ast", "per"];

            if (season === g.season) {
                // Show players currently on the roster
                tx.objectStore("schedule").getAll().onsuccess = function (event) {
                    var i, numGamesRemaining, schedule;

                    // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
                    schedule = event.target.result;
                    numGamesRemaining = 0;
                    for (i = 0; i < schedule.length; i++) {
                        if (tid === schedule[i].homeTid || tid === schedule[i].awayTid) {
                            numGamesRemaining += 1;
                        }
                    }

                    tx.objectStore("players").index("tid").getAll(tid).onsuccess = function (event) {
                        var i, players;

                        players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: numGamesRemaining, showRookies: true, sortBy: "rosterOrder", showNoStats: true, fuzz: true});

                        for (i = 0; i < players.length; i++) {
                            if (tid === g.userTid && players.length > 5) {
                                players[i].canRelease = true;
                                if (tid === g.userTid && players[i].cashOwed <= team.cash) {
                                    players[i].canBuyOut = true;
                                } else {
                                    players[i].canBuyOut = false;
                                }
                            } else {
                                players[i].canBuyOut = false;
                                players[i].canRelease = false;
                            }
                        }

                        db.getPayroll(tx, tid, function (payroll) {
                            cb(team, players, payroll / 1000);
                        });
                    };
                };
            } else {
                // Show all players with stats for the given team and year
                tx.objectStore("players").index("statsTids").getAll(tid).onsuccess = function (event) {
                    var i, players;

                    players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: 0, showRookies: true, sortBy: "rosterOrder", fuzz: true});

                    for (i = 0; i < players.length; i++) {
                        players[i].age = players[i].age - (g.season - season);
                        players[i].canBuyOut = false;
                        players[i].canRelease = false;
                    }

                    cb(team, players, null);
                };
            }
        };
    }

    function display(abbrev, tid, season, team, players, payroll, updateEvents, cb) {
        var data, myMapping;

        myMapping = {
            players: {
                key: function (data) {
                    return ko.utils.unwrapObservable(data.pid);
                }
            }
        };

        mapping.fromJS({
            abbrev: abbrev,
            season: season,
            editable: season === g.season && tid === g.userTid,
            payroll: payroll,
            salaryCap: g.salaryCap / 1000,
            showTradeFor: season === g.season && tid !== g.userTid,
            players: players,
            team: team
        }, myMapping, vm);


        if (document.getElementById("league_content").dataset.id !== "roster") {
            data = {
                container: "league_content",
                template: "roster",
//                title: team.region + " " + team.name + " " + "Roster - " + season,
                title: abbrev + " " + "Roster - " + season,
                vars: {}
            };
            ui.update(data);
            ko.applyBindings(vm);
        }

        if (vm.editable()) {
            highlightHandles();
            editableChanged(vm.editable());
        }

        components.dropdown("roster-dropdown", ["teams", "seasons"], [abbrev, season], updateEvents);

        cb();
    }

    function update(abbrev, tid, season, updateEvents, cb) {
        if (document.getElementById("league_content").dataset.id !== "roster") {
            vm = {
                abbrev: ko.observable(),
                season: ko.observable(),
                payroll: ko.observable(),
                salaryCap: ko.observable(),
                team: {
                    cash: ko.observable(),
                    name: ko.observable(),
                    region: ko.observable()
                },
                players: ko.observable([]),
                showTradeFor: ko.observable(),
                editable: ko.observable()
            };
            vm.numRosterSpots = ko.computed(function () {
                return 15 - vm.players().length;
            });
            vm.currentSeason = ko.computed(function () {
                return g.season === vm.season();
            });
            vm.financesUrl = ko.computed(function () {
                return "/l/" + g.lid + "/team_finances/" + vm.abbrev();
            });
            vm.gameLogUrl = ko.computed(function () {
                return "/l/" + g.lid + "/game_log/" + vm.abbrev() + "/" + vm.season();
            });
        }

        if ((season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || abbrev !== vm.abbrev() || season !== vm.season()) {
            loadBefore(abbrev, tid, season, function (team, players, payroll) {
                display(abbrev, tid, season, team, players, payroll, updateEvents, cb);
            });
        }
    }

    function get(req) {
        // Fix broken links
        if (req.params.abbrev === "FA") {
            return Davis.location.assign(new Davis.Request("/l/" + g.lid + "/free_agents"));
        }

        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            var abbrev, out, season, tid;

            out = helpers.validateAbbrev(req.params.abbrev);
            tid = out[0];
            abbrev = out[1];
            season = helpers.validateSeason(req.params.season);

            update(abbrev, tid, season, updateEvents, cb);
        });
    }

    return {
        get: get
    };
});