define(["api", "db", "globals", "ui", "core/contractNegotiation", "core/finances", "core/game", "core/league", "core/season", "data/names", "lib/boxPlot", "lib/handlebars.runtime", "lib/jquery", "lib/underscore", "util/helpers", "util/viewHelpers", "views/dashboard", "views/draft", "views/draftSummary", "views/freeAgents", "views/gameLog", "views/history", "views/inbox", "views/leaders", "views/leagueDashboard", "views/leagueFinances", "views/manual", "views/message", "views/negotiation", "views/negotiationList", "views/player", "views/playerRatingDists", "views/playerRatings", "views/playerShotLocations", "views/playerStatDists", "views/playerStats", "views/playoffs", "views/roster", "views/schedule", "views/standings", "views/teamFinances", "views/teamHistory", "views/teamShotLocations", "views/teamStatDists", "views/teamStats", "views/trade"], function (api, db, g, ui, contractNegotiation, finances, game, league, season, names, boxPlot, Handlebars, $, _, helpers, viewHelpers, dashboard, draft, draftSummary, freeAgents, gameLog, history, inbox, leaders, leagueDashboard, leagueFinances, manual, message, negotiation, negotiationList, player, playerRatingDists, playerRatings, playerShotLocations, playerStatDists, playerStats, playoffs, roster, schedule, standings, teamFinances, teamHistory, teamShotLocations, teamStatDists, teamStats, trade) {
    "use strict";

    function newLeague(req) {
        var data, name, tid, teams;

        viewHelpers.beforeNonLeague();

        if (req.method === "get") {
            g.dbm.transaction("leagues").objectStore("leagues").openCursor(null, "prev").onsuccess = function (event) {
                var cursor, data, l, newLid, teams;

                cursor = event.target.result;
                if (cursor) {
                    newLid = cursor.value.lid + 1;
                } else {
                    newLid = 1;
                }

                teams = helpers.getTeams();

                data = {
                    container: "content",
                    template: "newLeague",
                    title: "Create New League",
                    vars: {teams: teams, name: "League " + newLid}
                };
                ui.update(data, function () {
                    var select, updatePopText;

                    updatePopText = function () {
                        var difficulty, team;

                        team = teams[select.val()];

                        if (team.popRank <= 5) {
                            difficulty = "very easy";
                        } else if (team.popRank <= 13) {
                            difficulty = "easy";
                        } else if (team.popRank <= 16) {
                            difficulty = "normal";
                        } else if (team.popRank <= 23) {
                            difficulty = "hard";
                        } else {
                            difficulty = "very hard";
                        }

                        $("#pop-text").html("Region population: " + team.pop + " million, #" + team.popRank + " leaguewide<br>Difficulty: " + difficulty);
                    };

                    select = $("select[name='tid']");
                    select.change(updatePopText);
                    select.keyup(updatePopText);

                    updatePopText();
                });
            };
        } else if (req.method === "post") {
            $("#create-new-league").attr("disabled", "disabled");  // Disable button
            tid = Math.floor(req.params.tid);
            if (tid >= 0 && tid <= 29) {
                league.create(req.params.name, tid, req.params.players, function (lid) {
                    ui.realtimeUpdate([], "/l/" + lid);
                });
            }
        }
    }

    function deleteLeague(req) {
        var lid;

        lid = parseInt(req.params.lid, 10);

        if (!req.params.confirm) {
            db.connectLeague(lid, function () {
                var transaction;

                transaction = g.dbl.transaction(["games", "players", "teams"]);
                transaction.objectStore("games").count().onsuccess = function (event) {
                    var numGames;

                    numGames = event.target.result;

                    transaction.objectStore("teams").get(0).onsuccess = function (event) {
                        var numSeasons;

                        numSeasons = event.target.result.seasons.length;

                        transaction.objectStore("players").count().onsuccess = function (event) {
                            var data, numPlayers;

                            numPlayers = event.target.result;

                            g.lid = lid;  // Injected into the template by ui.update
                            data = {
                                container: "content",
                                template: "deleteLeague",
                                title: "Dashboard",
                                vars: {numGames: numGames, numPlayers: numPlayers, numSeasons: numSeasons}
                            };
                            ui.update(data, req.raw.cb);
                        };
                    };
                };
            });
        } else {
            league.remove(lid, function () {
                req.redirect("/");
            });
        }
    }

    return {
        dashboard: dashboard,
        newLeague: newLeague,
        deleteLeague: deleteLeague,
        manual: manual,

        leagueDashboard: leagueDashboard,
        inbox: inbox,
        message: message,
        standings: standings,
        playoffs: playoffs,
        leagueFinances: leagueFinances,
        history: history,
        roster: roster,
        schedule: schedule,
        teamFinances: teamFinances,
        teamHistory: teamHistory,
        freeAgents: freeAgents,
        trade: trade,
        draft: draft,
        draftSummary: draftSummary,
        gameLog: gameLog,
        leaders: leaders,
        playerRatings: playerRatings,
        playerStats: playerStats,
        teamStats: teamStats,
        player: player,
        negotiationList: negotiationList,
        negotiation: negotiation,
        playerRatingDists: playerRatingDists,
        playerStatDists: playerStatDists,
        teamStatDists: teamStatDists,
        playerShotLocations: playerShotLocations,
        teamShotLocations: teamShotLocations
    };
});