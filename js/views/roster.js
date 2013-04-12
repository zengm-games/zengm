/**
 * @name views.gameLog
 * @namespace Current or historical rosters for every team. Current roster for user's team is editable.
 */
define(["api", "db", "globals", "ui", "lib/davis", "lib/knockout", "lib/knockout.mapping", "lib/jquery", "views/components", "util/helpers", "util/viewHelpers"], function (api, db, g, ui, Davis, ko, mapping, $, components, helpers, viewHelpers) {
    "use strict";

    var vm;

    function highlightHandles() {
        var i;

console.log('highlightHandles')
console.log(vm.players().length)
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

                    sortedPids = $(this).sortable("toArray");
                    for (i = 0; i < sortedPids.length; i++) {
                        sortedPids[i] = parseInt(sortedPids[i].substr(7), 10);
                    }

                    api.rosterReorder(sortedPids, function () {
                        highlightHandles();
                    });
                },
                disabled: true
            });
        }

        if (editable) {
            // Roster reordering
            rosterTbody.sortable("enable").disableSelection();
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
                    if (vm.team.cash() > this.dataset.cashOwed) {
                        if (window.confirm("Are you sure you want to buy out " + this.dataset.playerName + "? You will have to pay him the $" + this.dataset.cashOwed + "M remaining on his contract from your current cash reserves of " + helpers.formatCurrency(vm.team.cash(), "M") + ". He will then become a free agent and his contract will no longer count towards your salary cap.")) {
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
                        alert("Error: You only have " + helpers.formatCurrency(vm.team.cash(), "M") + " in cash, but it would take $" + this.dataset.cashOwed + "M to buy out " + this.dataset.playerName + ".");
                    }
                }/* else if (this.dataset.action === "tradeFor") {

                }*/
            });
        } else {
            rosterTbody.sortable("disable").enableSelection();
        }
    }

    function cbAfterPlayers(tx, abbrev, tid, season, editable, team, players, payroll, updateEvents, cb) {
        var data, i, mapPlayersByPid, x;

        for (i = 0; i < players.length; i++) {
            if (players.length > 5) {
                players[i].canRelease = true;
                if (players[i].cashOwed <= team.cash) {
                    players[i].canBuyOut = true;
                } else {
                    players[i].canBuyOut = false;
                }
            } else {
                players[i].canRelease = false;
            }
        }

        mapPlayersByPid = {
            players: {
                key: function (data) {
                    return ko.utils.unwrapObservable(data.pid);
                }
            }
        };

        /*vm.abbrev(abbrev);
        vm.season(season);
        vm.numRosterSpots(15 - players.length);
        vm.payroll(payroll);
        vm.salaryCap(g.salaryCap / 1000);
        vm.showTradeFor(season === g.season && tid !== g.userTid);*/
        mapping.fromJS({
            abbrev: abbrev,
            season: season,
            editable: editable,
            numRosterSpots: 15 - players.length,
            payroll: payroll,
            salaryCap: g.salaryCap / 1000,
            showTradeFor: season === g.season && tid !== g.userTid,
            players: players,
            team: team
        }, mapPlayersByPid, vm);


        if (document.getElementById("league_content").dataset.id !== "roster") {
console.log('NO ROSTER YET')
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

        if (editable) {
            highlightHandles();
        }

        components.dropdown("roster-dropdown", ["teams", "seasons"], [abbrev, season], updateEvents);

        if (cb !== undefined) {
            cb();
        }
    }

    // We need to update, so first do all the stuff common to every type of update
    function loadBefore(abbrev, tid, season, updateEvents, cb) {
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

            editable = false;
            if (season === g.season) {
                // Show players currently on the roster
                if (tid === g.userTid) {
                    editable = true;
                }
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

                        db.getPayroll(tx, tid, function (payroll) {
                            cbAfterPlayers(tx, abbrev, tid, season, editable, team, players, payroll / 1000, updateEvents, cb);
                        });
                    };
                };
            } else {
                // Show all players with stats for the given team and year
                tx.objectStore("players").index("statsTids").getAll(tid).onsuccess = function (event) {
                    var i, players;

                    players = db.getPlayers(event.target.result, season, tid, attributes, stats, ratings, {numGamesRemaining: 0, showRookies: true, sortBy: "rosterOrder", fuzz: true});

                    // Fix ages
                    for (i = 0; i < players.length; i++) {
                        players[i].age = players[i].age - (g.season - season);
                    }

                    cbAfterPlayers(tx, abbrev, tid, season, editable, team, players, null, updateEvents, cb);
                };
            }
        };
    }
    function update(abbrev, tid, season, updateEvents, cb) {
        if (document.getElementById("league_content").dataset.id !== "roster") {
            vm = {
                abbrev: ko.observable(),
                season: ko.observable(),
                numRosterSpots: ko.observable(),
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
            vm.currentSeason = ko.computed(function () {
                return g.season === vm.season();
            });
            vm.financesUrl = ko.computed(function () {
                return "/l/" + g.lid + "/team_finances/" + vm.abbrev();
            });
            vm.gameLogUrl = ko.computed(function () {
                return "/l/" + g.lid + "/game_log/" + vm.abbrev() + "/" + vm.season();
            });
            vm.editable.subscribe(editableChanged);
        }

        if ((season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || abbrev !== vm.abbrev() || season !== vm.season()) {
            loadBefore(abbrev, tid, season, updateEvents, cb);
        }
    }

    function get(req) {
        // Fix broken links
        if (req.params.abbrev === "FA") {
            return Davis.location.assign(new Davis.Request("/l/" + g.lid + "/free_agents"));
        }

        viewHelpers.beforeLeague(req, function () {
            var abbrev, out, season, tid, updateEvents;

            out = helpers.validateAbbrev(req.params.abbrev);
            tid = out[0];
            abbrev = out[1];
            season = helpers.validateSeason(req.params.season);
            updateEvents = req.raw.updateEvents !== undefined ? req.raw.updateEvents : [];

            update(abbrev, tid, season, updateEvents, req.raw.cb);
        });
    }

    return {
        get: get
    };
});