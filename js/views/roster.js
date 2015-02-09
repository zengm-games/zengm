/**get
 * @name views.roster
 * @namespace Current or historical rosters for every team. Current roster for user's team is editable.
 */
define(["dao", "globals", "ui", "core/league", "core/player", "core/season", "core/team", "core/trade", "lib/bluebird", "lib/knockout", "lib/jquery", "views/components", "util/bbgmView", "util/helpers"], function (dao, g, ui, league, player, season, team, trade, Promise, ko, $, components, bbgmView, helpers) {
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

    function doReorder(sortedPids) {
        var i, tx, updateRosterOrder;

        tx = dao.tx("players", "readwrite");

        updateRosterOrder = function (pid, rosterOrder) {
            return dao.players.get({
                ot: tx,
                key: pid
            }).then(function (p) {
                p.rosterOrder = rosterOrder;
                return dao.players.put({
                    ot: tx,
                    value: p
                });
            });
        };

        // Update rosterOrder
        for (i = 0; i < sortedPids.length; i++) {
            updateRosterOrder(sortedPids[i], i);
        }

        return tx.complete().then(function () {
            league.updateLastDbChange();
        });
    }

    function doRelease(pid, justDrafted) {
        var tx;

        tx = dao.tx(["players", "releasedPlayers", "teams"], "readwrite");

        return dao.players.count({
            ot: tx,
            index: "tid",
            key: g.userTid
        }).then(function (numPlayersOnRoster) {
            if (numPlayersOnRoster <= 5) {
                return "You must keep at least 5 players on your roster.";
            }

            return dao.players.get({ot: tx, key: pid}).then(function (p) {
                // Don't let the user update CPU-controlled rosters
                if (p.tid === g.userTid) {
                    player.release(tx, p, justDrafted);
                    return tx.complete().then(function () {
                        league.updateLastDbChange();
                    });
                }

                return "You aren't allowed to do this.";
            });
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
                update: function () {
                    var i, sortedPids;

                    sortedPids = $(this).sortable("toArray", {attribute: "data-pid"});
                    for (i = 0; i < sortedPids.length; i++) {
                        sortedPids[i] = parseInt(sortedPids[i], 10);
                    }

                    doReorder(sortedPids).then(highlightHandles);
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

        this.ptChange = function (p) {
            var pid, ptModifier;

            // NEVER UPDATE AI TEAMS
            // This shouldn't be necessary, but sometimes it gets triggered
            if (this.team.tid() !== g.userTid) {
                return;
            }

            // Update ptModifier in database
            pid = p.pid();
            ptModifier = parseFloat(p.ptModifier());
            dao.players.get({key: pid}).then(function (p) {
                if (p.ptModifier !== ptModifier) {
                    p.ptModifier = ptModifier;

                    dao.players.put({value: p}).then(function () {
                        league.updateLastDbChange();
                    });
                }
            });
        }.bind(this);
    }

    mapping = {
        players: {
            key: function (data) {
                return ko.unwrap(data.pid);
            }
        }
    };

    function updateRoster(inputs, updateEvents, vm) {
        var tx, vars;

        if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && (updateEvents.indexOf("gameSim") >= 0 || updateEvents.indexOf("playerMovement") >= 0)) || inputs.abbrev !== vm.abbrev() || inputs.season !== vm.season()) {
            vars = {
                abbrev: inputs.abbrev,
                season: inputs.season,
                editable: inputs.season === g.season && inputs.tid === g.userTid,
                salaryCap: g.salaryCap / 1000,
                showTradeFor: inputs.season === g.season && inputs.tid !== g.userTid,
                ptModifiers: [
                    {text: "0", ptModifier: "0"},
                    {text: "-", ptModifier: "0.75"},
                    {text: " ", ptModifier: "1"},
                    {text: "+", ptModifier: "1.25"},
                    {text: "++", ptModifier: "1.75"}
                ]
            };

            tx = dao.tx(["players", "playerStats", "releasedPlayers", "schedule", "teams"]);

            return team.filter({
                season: inputs.season,
                tid: inputs.tid,
                attrs: ["tid", "region", "name", "strategy", "imgURL"],
                seasonAttrs: ["profit", "won", "lost", "playoffRoundsWon"],
                ot: tx
            }).then(function (t) {
                var attrs, ratings, stats;

                vars.team = t;

                attrs = ["pid", "tid", "draft", "name", "pos", "age", "contract", "cashOwed", "rosterOrder", "injury", "ptModifier", "watch", "gamesUntilTradable"];  // tid and draft are used for checking if a player can be released without paying his salary
                ratings = ["ovr", "pot", "dovr", "dpot", "skills"];
                stats = ["gp", "min", "pts", "trb", "ast", "per", "yearsWithTeam"];

                if (inputs.season === g.season) {
                    // Show players currently on the roster
                    return Promise.all([
                        season.getSchedule({ot: tx}),
                        dao.players.getAll({
                            ot: tx,
                            index: "tid",
                            key: inputs.tid,
                            statsSeasons: [inputs.season],
                            statsTid: inputs.tid
                        }),
                        team.getPayroll(tx, inputs.tid).get(0)
                    ]).spread(function (schedule, players, payroll) {
                        var i, numGamesRemaining;

                        // numGamesRemaining doesn't need to be calculated except for g.userTid, but it is.
                        numGamesRemaining = 0;
                        for (i = 0; i < schedule.length; i++) {
                            if (inputs.tid === schedule[i].homeTid || inputs.tid === schedule[i].awayTid) {
                                numGamesRemaining += 1;
                            }
                        }

                        players = player.filter(players, {
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
                        players.sort(function (a, b) { return a.rosterOrder - b.rosterOrder; });

                        // Add untradable property
                        players = trade.filterUntradable(players);

                        for (i = 0; i < players.length; i++) {
                            // Can release from user's team, except in playoffs because then no free agents can be signed to meet the minimum roster requirement
                            if (inputs.tid === g.userTid && (g.phase !== g.PHASE.PLAYOFFS || players.length > 15) && !g.gameOver) {
                                players[i].canRelease = true;
                            } else {
                                players[i].canRelease = false;
                            }

                            // Convert ptModifier to string so it doesn't cause unneeded knockout re-rendering
                            players[i].ptModifier = String(players[i].ptModifier);
                        }

                        vars.players = players;

                        vars.payroll = payroll / 1000;

                        return vars;
                    });
                }

                // Show all players with stats for the given team and year
                // Needs all seasons because of YWT!
                return dao.players.getAll({
                    ot: tx,
                    index: "statsTids",
                    key: inputs.tid,
                    statsSeasons: "all",
                    statsTid: inputs.tid
                }).then(function (players) {
                    var i;

                    players = player.filter(players, {
                        attrs: attrs,
                        ratings: ratings,
                        stats: stats,
                        season: inputs.season,
                        tid: inputs.tid,
                        fuzz: true
                    });
                    players.sort(function (a, b) { return b.stats.gp * b.stats.min - a.stats.gp * a.stats.min; });

                    for (i = 0; i < players.length; i++) {
                        players[i].age = players[i].age - (g.season - inputs.season);
                        players[i].canRelease = false;
                    }

                    vars.players = players;
                    vars.payroll = null;

                    return vars;
                });
            });
        }
    }

    function uiFirst(vm) {
        // Release and Buy Out buttons, which will only appear if the roster is editable
        // Trade For button is handled by POST
        $("#roster").on("click", "button", function () {
            var i, justDrafted, pid, players, releaseMessage;

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
                    doRelease(pid, justDrafted).then(function (error) {
                        if (error) {
                            window.alert("Error: " + error);
                        } else {
                            ui.realtimeUpdate(["playerMovement"]);
                        }
                    });
                }
            }
        });

        $("#roster-auto-sort").click(function () {
            var tx;

            vm.players([]); // This is a hack to force a UI update because the jQuery UI sortable roster reordering does not update the view model, which can cause the view model to think the roster is sorted correctly when it really isn't. (Example: load the roster, auto sort, reload, drag reorder it, auto sort -> the auto sort doesn't update the UI.) Fixing this issue would fix flickering.

            tx = dao.tx("players", "readwrite");
            team.rosterAutoSort(tx, g.userTid);

            // Explicitly make sure writing is done for rosterAutoSort
            tx.complete().then(function () {
                league.updateLastDbChange();
                ui.realtimeUpdate(["playerMovement"]);
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
            editableChanged(vm.editable());
        }).extend({throttle: 1});

        ko.computed(function () {
            var picture;
            picture = document.getElementById("picture");

            // If imgURL is not an empty string, use it for team logo on roster page
            if (vm.team.imgURL()) {
                picture.style.display = "inline";
                picture.style.backgroundImage = "url('" + vm.team.imgURL() + "')";
            }
        }).extend({throttle: 1});

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

        $("#roster").on("change", "select", function () {
            var backgroundColor, color;

            // Update select color

            // NEVER UPDATE AI TEAMS
            // This shouldn't be necessary, but sometimes it gets triggered
            if (vm.team.tid() !== g.userTid) {
                return;
            }

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