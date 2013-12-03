/**
 * @name views.roster
 * @namespace Current or historical rosters for every team. Current roster for user's team is editable.
 */
define(["db", "globals", "ui", "core/finances", "core/player", "core/team", "lib/knockout", "lib/jquery", "views/components", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (db, g, ui, finances, player, team, ko, $, components, bbgmView, helpers, viewHelpers) {
    "use strict";

    var mapping;

    function highlightHandles() {
        var i;

        i = 1;
        $("#roster tbody").children().each(function () {
            var tr;

            tr = $(this);
            if (i <= 5) {
                // Because of CSS specificity issues, hard code color
                //tr.find("td:first").removeClass("btn-info").addClass("btn-primary");
                tr.find("td:first").css("background-color", "#428bca");
            } else {
                //tr.find("td:first").removeClass("btn-primary").addClass("btn-info");
                tr.find("td:first").css("background-color", "#5bc0de");
            }
            if (i === 5) {
                tr.addClass("separator");
            } else {
                tr.removeClass("separator");
            }
            i++;
        });
    }

    function doReorder(sortedPids, cb) {
        var tx;

        tx = g.dbl.transaction("players", "readwrite");

        // Update rosterOrder
        tx.objectStore("players").index("tid").openCursor(g.userTid).onsuccess = function (event) {
            var cursor, i, p;

            cursor = event.target.result;
            if (cursor) {
                p = cursor.value;
                for (i = 0; i < sortedPids.length; i++) {
                    if (sortedPids[i] === p.pid) {
                        p.rosterOrder = i;
                        break;
                    }
                }
                cursor.update(p);
                cursor.continue();
            }
        };

        tx.oncomplete = function () {
            db.setGameAttributes({lastDbChange: Date.now()}, function () {
                cb();
            });
        };
    }

    function doRelease(pid, justDrafted, cb) {
        var playerStore, transaction;

        transaction = g.dbl.transaction(["players", "releasedPlayers", "teams"], "readwrite");
        playerStore = transaction.objectStore("players");

        playerStore.index("tid").count(g.userTid).onsuccess = function (event) {
            var numPlayersOnRoster;

            numPlayersOnRoster = event.target.result;

            if (numPlayersOnRoster <= 5) {
                return cb("You must keep at least 5 players on your roster.");
            }

            pid = parseInt(pid, 10);
            playerStore.get(pid).onsuccess = function (event) {
                var p;

                p = event.target.result;
                // Don't let the user update CPU-controlled rosters
                if (p.tid === g.userTid) {
                    player.release(transaction, p, justDrafted, function () {
                        db.setGameAttributes({lastDbChange: Date.now()}, function () {
                            cb();
                        });
                    });
                } else {
                    return cb("You aren't allowed to do this.");
                }
            };
        };
    }

    function editableChanged(editable, vm) {
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

                    doReorder(sortedPids, function () {
                        highlightHandles();
                    });
                },
                handle: ".roster-handle",
                disabled: true
            });
        }

        if (editable) {
            rosterTbody.sortable("enable");//.disableSelection();
        } else {
            rosterTbody.sortable("disable");//.enableSelection();
        }
    }

    function get(req) {
        var inputs, out;

        // Fix broken links
        if (req.params.abbrev === "FA") {
            return {
                redirectUrl: helpers.leagueUrl(["free_agents"])
            };
        }

        inputs = {};

        out = helpers.validateAbbrev(req.params.abbrev);
        inputs.tid = out[0];
        inputs.abbrev = out[1];
        inputs.season = helpers.validateSeason(req.params.season);

        return inputs;
    }

    function InitViewModel() {
        this.abbrev = ko.observable();
        this.season = ko.observable();
        this.payroll = ko.observable();
        this.salaryCap = ko.observable();
        this.team = {
            cash: ko.observable(),
            name: ko.observable(),
            region: ko.observable()
        };
        this.players = ko.observable([]);
        this.showTradeFor = ko.observable();
        this.editable = ko.observable();

        // Throttling these makes transient error messages like "Message: ReferenceError: isCurrentSeason is undefined". Not throttling doesn't seem to induce any lag.
        this.numRosterSpots = ko.computed(function () {
            return 15 - this.players().length;
        }, this);
        this.isCurrentSeason = ko.computed(function () {
            return g.season === this.season();
        }, this);
    }

    mapping = {
        players: {
            key: function (data) {
                return ko.utils.unwrapObservable(data.pid);
            }
        }
    };

    function updateRoster(inputs, updateEvents, vm) {
        var deferred, vars, tx;

        if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.abbrev !== vm.abbrev() || inputs.season !== vm.season()) {
            deferred = $.Deferred();

            vars = {
                abbrev: inputs.abbrev,
                season: inputs.season,
                editable: inputs.season === g.season && inputs.tid === g.userTid,
                salaryCap: g.salaryCap / 1000,
                showTradeFor: inputs.season === g.season && inputs.tid !== g.userTid,
                ptModifiers: [
                    {text: "0", ptModifier: 0},
                    {text: "-", ptModifier: 0.75},
                    {text: " ", ptModifier: 1},
                    {text: "+", ptModifier: 1.25},
                    {text: "++", ptModifier: 1.75}
                ]
            };

            tx = g.dbl.transaction(["players", "releasedPlayers", "schedule", "teams"]);

            team.filter({
                season: inputs.season,
                tid: inputs.tid,
                attrs: ["region", "name", "strategy", "imgURL"],
                seasonAttrs: ["profit", "won", "lost", "playoffRoundsWon"],
                ot: tx
            }, function (t) {
                var attrs, ratings, stats;

                vars.team = t;

                attrs = ["pid", "tid", "draft", "name", "pos", "age", "contract", "cashOwed", "rosterOrder", "injury", "ptModifier"];  // tid and draft are used for checking if a player can be released without paying his salary
                ratings = ["ovr", "pot", "skills"];
                stats = ["gp", "min", "pts", "trb", "ast", "per"];

                if (inputs.season === g.season) {
                    // Show players currently on the roster
                    tx.objectStore("schedule").getAll().onsuccess = function (event) {
                        var i, numGamesRemaining, schedule;

                        // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
                        schedule = event.target.result;
                        numGamesRemaining = 0;
                        for (i = 0; i < schedule.length; i++) {
                            if (inputs.tid === schedule[i].homeTid || inputs.tid === schedule[i].awayTid) {
                                numGamesRemaining += 1;
                            }
                        }

                        tx.objectStore("players").index("tid").getAll(inputs.tid).onsuccess = function (event) {
                            var i, players;

                            players = player.filter(event.target.result, {
                                attrs: attrs,
                                ratings: ratings,
                                stats: stats,
                                season: inputs.season,
                                tid: inputs.tid,
                                showNoStats: true,
                                showRookies: true,
                                fuzz: true,
                                numGamesRemaining: numGamesRemaining
                            });
                            players.sort(function (a, b) {  return a.rosterOrder - b.rosterOrder; });

                            for (i = 0; i < players.length; i++) {
                                if (inputs.tid === g.userTid) {
                                    players[i].canRelease = true;
                                } else {
                                    players[i].canRelease = false;
                                }
                            }

                            vars.players = players;

                            db.getPayroll(tx, inputs.tid, function (payroll) {
                                vars.payroll = payroll / 1000;

                                deferred.resolve(vars);
                            });
                        };
                    };
                } else {
                    // Show all players with stats for the given team and year
                    tx.objectStore("players").index("statsTids").getAll(inputs.tid).onsuccess = function (event) {
                        var i, players;

                        players = player.filter(event.target.result, {
                            attrs: attrs,
                            ratings: ratings,
                            stats: stats,
                            season: inputs.season,
                            tid: inputs.tid,
                            fuzz: true
                        });
                        players.sort(function (a, b) {  return b.stats.gp * b.stats.min - a.stats.gp * a.stats.min; });

                        for (i = 0; i < players.length; i++) {
                            players[i].age = players[i].age - (g.season - inputs.season);
                            players[i].canRelease = false;
                        }

                        vars.players = players;
                        vars.payroll = null;

                        deferred.resolve(vars);
                    };
                }
            });
            return deferred.promise();
        }
    }

    function uiFirst(vm) {
        // Release and Buy Out buttons, which will only appear if the roster is editable
        // Trade For button is handled by POST
        $("#roster").on("click", "button", function (event) {
            var justDrafted, i, pid, players, releaseMessage, tr;

            pid = parseInt(this.parentNode.parentNode.dataset.pid, 10);
            players = vm.players();
            for (i = 0; i < players.length; i++) {
                if (players[i].pid() === pid) {
                    break;
                }
            }

            if (this.dataset.action === "release") {
                // If a player was just drafted by his current team and the regular season hasn't started, then he can be released without paying anything
                justDrafted = players[i].tid() === players[i].draft.tid() && ((players[i].draft.year() === g.season && g.phase >= g.PHASE.DRAFT) || (players[i].draft.year() === g.season - 1 && g.phase < g.PHASE.REGULAR_SEASON));
                if (justDrafted) {
                    releaseMessage = "Are you sure you want to release " + players[i].name() + "?  He will become a free agent and no longer take up a roster spot on your team. Because you just drafted him and the regular season has not started yet, you will not have to pay his contract.";
                } else {
                    releaseMessage = "Are you sure you want to release " + players[i].name() + "?  He will become a free agent and no longer take up a roster spot on your team, but you will still have to pay his salary (and have it count against the salary cap) until his contract expires in " + players[i].contract.exp() + ".";
                }
                if (window.confirm(releaseMessage)) {
                    tr = this.parentNode.parentNode;
                    doRelease(pid, justDrafted, function (error) {
                        if (error) {
                            alert("Error: " + error);
                        } else {
                            ui.realtimeUpdate(["playerMovement"]);
                        }
                    });
                }
            }
        });

        $("#roster-auto-sort").click(function (event) {
            vm.players([]); // This is a hack to force a UI update because the jQuery UI sortable roster reordering does not update the view model, which can cause the view model to think the roster is sorted correctly when it really isn't. (Example: load the roster, auto sort, reload, drag reorder it, auto sort -> the auto sort doesn't update the UI.) Fixing this issue would fix flickering.
            team.rosterAutoSort(null, g.userTid, function () {
                db.setGameAttributes({lastDbChange: Date.now()}, function () {
                    ui.realtimeUpdate(["playerMovement"]);
                });
            });
        });

        ko.computed(function () {
            ui.title(vm.team.region() + " " + vm.team.name() + " " + "Roster - " + vm.season());
        }).extend({throttle: 1});

        ko.computed(function () {
            vm.players(); // Ensure this runs when vm.players changes.
            if (vm.editable()) {
                highlightHandles();
            }
            editableChanged(vm.editable(), vm);
        }).extend({throttle: 1});

        ko.computed(function () {
            var pic, teamInfo, instructions;
            pic = document.getElementById("picture");
            teamInfo = document.getElementById("teamInfo");

            // If imgURL is not an empty string, use it for team logo on roster page
            if (vm.team.imgURL()) {
            	instructions = document.getElementById("instructions");
                pic.style.backgroundImage = "url('" + vm.team.imgURL() + "')";
            } else {
                teamInfo.style.float = "none";
                pic.style.display = "none";
            }
        }).extend({throttle: 1});

        $("#roster").on("change", "select", function () {
            var backgroundColor, color, pid, ptModifier;

            // Update select color

            // These don't work in Firefox, so do it manually
//            backgroundColor = $('option:selected', this).css('background-color');
//            color = $('option:selected', this).css('color');
            if (this.value === "1") {
                backgroundColor = "#ccc";
                color = "#000";
            } else if (this.value === "1.75") {
                backgroundColor = "#070";
                color = "#fff";
            } else if (this.value === "1.25") {
                backgroundColor = "#0f0";
                color = "#000";
            } else if (this.value === "0.75") {
                backgroundColor = "#ff0";
                color = "#000";
            } else if (this.value === "0") {
                backgroundColor = "#a00";
                color = "#fff";
            }

            this.style.color = color;
            this.style.backgroundColor = backgroundColor;

            // Update ptModifier in database
            pid = parseInt(this.parentNode.parentNode.dataset.pid, 10);
            ptModifier = parseFloat(this.value);
            g.dbl.transaction("players", "readwrite").objectStore("players").openCursor(pid).onsuccess = function (event) {
                var cursor, p;

                cursor = event.target.result;
                p = cursor.value;
                if (p.ptModifier !== ptModifier) {
                    p.ptModifier = ptModifier;
                    cursor.update(p);

                    db.setGameAttributes({lastDbChange: Date.now()});
                }
            };
        });

        $("#help-roster-pt").popover({
            title: "Playing Time Modifier",
            html: true,
            content: "<p>Your coach will divide up playing time based on ability and stamina. If you want to influence his judgement, your options are:</p>" +
                '<span style="background-color: #a00; color: #fff">0 No Playing Time</span><br>' +
                '<span style="background-color: #ff0">- Less Playing Time</span><br>' +
                '<span style="background-color: #ccc">&nbsp;&nbsp;&nbsp; Let Coach Decide</span><br>' +
                '<span style="background-color: #0f0">+ More Playing Time</span><br>' +
                '<span style="background-color: #070; color: #fff">++ Even More Playing Time</span>'
        });

        $("#help-roster-release").popover({
            title: "Release Player",
            html: true,
            content: "<p>To free up a roster spot, you can release a player from your team. You will still have to pay his salary (and have it count against the salary cap) until his contract expires (you can view your released players' contracts in your <a href=\"" + helpers.leagueUrl(["team_finances"]) + "\">Team Finances</a>).</p>However, if you just drafted a player and the regular season has not started yet, his contract is not guaranteed and you can release him for free."
        });

        ui.tableClickableRows($("#roster"));
    }

    function uiEvery(updateEvents, vm) {
        components.dropdown("roster-dropdown", ["teams", "seasons"], [vm.abbrev(), vm.season()], updateEvents);

        $("#roster select").change(); // Set initial bg colors
    }

    return bbgmView.init({
        id: "roster",
        get: get,
        InitViewModel: InitViewModel,
        mapping: mapping,
        runBefore: [updateRoster],
        uiFirst: uiFirst,
        uiEvery: uiEvery
    });
});