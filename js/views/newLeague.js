/**
 * @name views.newLeague
 * @namespace Create new league form.
 */
define(["globals", "ui", "core/league", "lib/jquery", "lib/knockout.mapping", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, league, $, komapping, bbgmView, helpers, viewHelpers) {
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

        // Davis.js can't handle file uploads, so do this manually first
        if (req.params.rosters === "custom-rosters") {
            file = document.getElementById("custom-rosters-file").files[0];
            if (file !== undefined) {
                reader = new window.FileReader();
                reader.readAsText(file);
                reader.onload = function (event) {
                    var leagueFile, randomizeRosters;

                    leagueFile = JSON.parse(event.target.result);

                    startingSeason = leagueFile.startingSeason !== undefined ? leagueFile.startingSeason : startingSeason;

                    randomizeRosters = req.params.hasOwnProperty("randomize-rosters");

                    league.create(req.params.name, tid, leagueFile, startingSeason, randomizeRosters, function (lid) {
                        ui.realtimeUpdate([], "/l/" + lid, cb);
                    });
                };
            } else {
                league.create(req.params.name, tid, null, startingSeason, false, function (lid) {
                    ui.realtimeUpdate([], "/l/" + lid, cb);
                });
            }
        } else {
            league.create(req.params.name, tid, null, startingSeason, false, function (lid) {
                ui.realtimeUpdate([], "/l/" + lid, cb);
            });
        }
    }

    function updateNewLeague(inputs, updateEvents) {
        var deferred;

        deferred = $.Deferred();

        g.dbm.transaction("leagues").objectStore("leagues").openCursor(null, "prev").onsuccess = function (event) {
            var cursor, newLid, teams;

            cursor = event.target.result;
            if (cursor) {
                newLid = cursor.value.lid + 1;
            } else {
                newLid = 1;
            }

            teams = helpers.getTeamsDefault();
            teams.unshift({
                tid: -1,
                region: "Random",
                name: "Team"
            });

            deferred.resolve({
                name: "League " + newLid,
                teams: teams
            });
        };

        return deferred.promise();
    }

    function uiFirst(vm) {
        var fileEl, newLeagueRostersEl, selectRosters, selectTeam, setTeams, updatePopText, updateShowUploadForm, useCustomTeams;

        ui.title("Create New League");

        updatePopText = function () {
            var difficulty, team;

            team = vm.teams()[parseInt(selectTeam.val(), 10) + 1];

            if (team.tid() >= 0) {
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

                document.getElementById("pop-text").innerHTML = "Region population: " + team.pop() + " million, #" + team.popRank() + " leaguewide<br>Difficulty: " + difficulty;
            } else {
                document.getElementById("pop-text").innerHTML = "Region population: ?<br>Difficulty: ?";
            }
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
        setTeams = function (newTeams) {
            if (newTeams !== undefined) {

                newTeams.forEach(function (newTeam) {
                    // Is pop hidden in season, like in editTeamInfo import?
                    if (!newTeam.hasOwnProperty("pop") && newTeam.hasOwnProperty("seasons")) {
                        newTeam.pop = newTeam.seasons[newTeam.seasons.length - 1].pop;
                    }

                    newTeam.pop = helpers.round(newTeam.pop, 2);
                });

                // Add popRanks
                newTeams = helpers.addPopRank(newTeams);

                // Add random team
                newTeams.unshift({
                    tid: -1,
                    region: "Random",
                    name: "Team"
                });

                komapping.fromJS({teams: newTeams}, vm);
            }

            updatePopText();
        };
        useCustomTeams = function () {
            var file, reader;

            if (fileEl.files.length) {
                file = fileEl.files[0];

                reader = new window.FileReader();
                reader.readAsText(file);
                reader.onload = function (event) {
                    var newTeams, leagueFile;

                    leagueFile = JSON.parse(event.target.result);
                    newTeams = leagueFile.teams;
                    setTeams(newTeams);

                    // Is a userTid specified?
                    if (leagueFile.hasOwnProperty("gameAttributes")) {
                        leagueFile.gameAttributes.some(function (attribute) {
                            if (attribute.key === "userTid") {
                                // Set it to select the userTid entry
                                document.getElementById("new-league-tid").value = attribute.value;
                                updatePopText(); // Not caught by event handlers for some reason
                                return true;
                            }
                        });
                    }
                };
            }
        };
        fileEl = document.getElementById("custom-rosters-file");
        fileEl.addEventListener("change", useCustomTeams);
        // Handle switch away from custom roster teams
        newLeagueRostersEl = document.getElementById("new-league-rosters");
        newLeagueRostersEl.addEventListener("change", function () {
            if (this.value === "custom-rosters") {
                useCustomTeams();
            } else {
                setTeams(helpers.getTeamsDefault());
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