/**
 * @name views.newLeague
 * @namespace Create new league form.
 */
define(["globals", "ui", "core/league", "lib/jquery", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, league, $, bbgmView, helpers, viewHelpers) {
    "use strict";

    function post(req) {
        var cb, file, reader, startingSeason, tid;

        $("#create-new-league").attr("disabled", "disabled");

        startingSeason = 2013;

        cb = function () {
            // Show helpful information if this is the first league
            if (g.lid === 1) {
                ui.highlightPlayButton();
            }
        };

        tid = Math.floor(req.params.tid);
        if (tid >= 0 && tid <= 29) {
            // Davis.js can't handle file uploads, so do this manually first
            if (req.params.rosters === "custom-rosters") {
                file = document.getElementById("custom-rosters-file").files[0];
                if (file !== undefined) {
                    reader = new window.FileReader();
                    reader.readAsText(file);
                    reader.onload = function (event) {
                        var rosters, randomizeRosters;

                        rosters = JSON.parse(event.target.result);

                        startingSeason = rosters.startingSeason !== undefined ? rosters.startingSeason : startingSeason;

                        randomizeRosters = req.params.hasOwnProperty("randomize-rosters");

                        league.create(req.params.name, tid, rosters.players, rosters.teams, startingSeason, randomizeRosters, function (lid) {
                            ui.realtimeUpdate([], "/l/" + lid, cb);
                        });
                    };
                } else {
                    league.create(req.params.name, tid, undefined, undefined, startingSeason, false, function (lid) {
                        ui.realtimeUpdate([], "/l/" + lid, cb);
                    });
                }
            } else {
                league.create(req.params.name, tid, undefined, undefined, startingSeason, false, function (lid) {
                    ui.realtimeUpdate([], "/l/" + lid, cb);
                });
            }
        }
    }

    function updateNewLeague(inputs, updateEvents) {
        var deferred;

        deferred = $.Deferred();

        g.dbm.transaction("leagues").objectStore("leagues").openCursor(null, "prev").onsuccess = function (event) {
            var cursor, data, l, newLid, teams;

            cursor = event.target.result;
            if (cursor) {
                newLid = cursor.value.lid + 1;
            } else {
                newLid = 1;
            }

            teams = helpers.getTeamsDefault();

            deferred.resolve({
                name: "League " + newLid,
                teams: teams
            });
        };

        return deferred.promise();
    }

    function uiFirst(vm) {
        var fileEl, mergeTeams, newLeagueRostersEl, selectRosters, selectTeam, teams, updatePopText, updateShowUploadForm, useCustomTeams;

        ui.title("Create New League");

        updatePopText = function () {
            var difficulty, team;

            team = vm.teams()[selectTeam.val()];

            if (team.popRank() <= 3) {
                difficulty = "very easy";
            } else if (team.popRank() <= 8) {
                difficulty = "easy";
            } else if (team.popRank() <= 16) {
                difficulty = "normal";
            } else if (team.popRank() <= 24) {
                difficulty = "hard";
            } else {
                difficulty = "very hard";
            }

            $("#pop-text").html("Region population: " + team.pop() + " million, #" + team.popRank() + " leaguewide<br>Difficulty: " + difficulty);
        };

        selectTeam = $("select[name='tid']");
        selectTeam.change(updatePopText);
        selectTeam.keyup(updatePopText);

        updateShowUploadForm = function () {
            if (selectRosters.val() === "custom-rosters") {
                $("#custom-rosters").show();
                $("#randomize-rosters").show();
            } else {
                $("#custom-rosters").hide();
                $("#randomize-rosters").hide();
            }
        };

        selectRosters = $("select[name='rosters']");
        selectRosters.change(updateShowUploadForm);
        selectRosters.keyup(updateShowUploadForm);

        updatePopText();
        updateShowUploadForm();

        // Handle custom roster teams
        mergeTeams = function (newTeams) {
            var i, oldTeams, prop;

            if (newTeams !== undefined) {
                // Any update from current teams?
                oldTeams = vm.teams();
                for (i = 0; i < newTeams.length; i++) {
                    // Fill in default values as needed
                    for (prop in oldTeams[i]) {
                        if (oldTeams[i].hasOwnProperty(prop) && newTeams[i].hasOwnProperty(prop)) {
                            vm.teams()[i][prop](newTeams[i][prop]);
                        }
                    }
                }
            }

            updatePopText();
        };
        useCustomTeams = function () {
            var file, reader;

            file = fileEl.files[0];

            reader = new window.FileReader();
            reader.readAsText(file);
            reader.onload = function (event) {
                var newTeams, rosters;

                rosters = JSON.parse(event.target.result);
                newTeams = rosters.teams;
                mergeTeams(newTeams);
            };
        };
        fileEl = document.getElementById("custom-rosters-file");
        fileEl.addEventListener("change", useCustomTeams);
        // Handle switch away from custom roster teams
        newLeagueRostersEl = document.getElementById("new-league-rosters");
        newLeagueRostersEl.addEventListener("change", function () {
            if (this.value === "custom-rosters") {
                useCustomTeams();
            } else {
                mergeTeams(helpers.getTeamsDefault())
            }
        });
    }

    return bbgmView.init({
        id: "newLeague",
        beforeReq: viewHelpers.beforeNonLeague,
        post: post,
        runBefore: [updateNewLeague],
        uiFirst: uiFirst
    });
});