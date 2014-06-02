/**
 * @name views.editTeamInfo
 * @namespace Edit Team Info.
 */
define(["db", "globals", "ui", "core/team", "lib/jquery", "lib/underscore", "util/bbgmView", "util/helpers"], function (db, g, ui, team, $, _, bbgmView, helpers) {
    "use strict";

    function post(req) {
        var button;

        button = document.getElementById("edit-team-info");
        button.disabled = true;

        g.dbl.transaction("teams", "readwrite").objectStore("teams").openCursor().onsuccess = function (event) {
            var cursor, t;

            cursor = event.target.result;
            if (cursor) {
                t = cursor.value;
                t.abbrev = req.params.abbrev[t.tid];
                t.region = req.params.region[t.tid];
                t.name = req.params.name[t.tid];
                t.seasons[t.seasons.length - 1].pop = parseFloat(req.params.pop[t.tid]);
                cursor.update(t);

                // Update meta cache of user's team
                if (t.tid === g.userTid) {
                    db.updateMetaNameRegion(g.lid, t.name, t.region);
                }

                cursor.continue();
            } else {
                // Updating cached values for team regions and team names for easy access.
                db.setGameAttributes({
                    lastDbChange: Date.now(),
                    teamAbbrevsCache: req.params.abbrev,
                    teamRegionsCache: req.params.region,
                    teamNamesCache: req.params.name
                }, function () {
                    button.disabled = false;
                    ui.realtimeUpdate([], helpers.leagueUrl(["edit_team_info"]));
                });
            }
        };
    }

    function updateTeamInfo() {
        var deferred;
        deferred = $.Deferred();

        team.filter({
            attrs: ["tid", "abbrev", "region", "name"],
            seasonAttrs: ["pop"],
            season: g.season
        }, function (teams) {
            var i;

            for (i = 0; i < teams.length; i++) {
                teams[i].pop = helpers.round(teams[i].pop, 6);
            }

            deferred.resolve({
                teams: teams
            });
        });

        return deferred.promise();
    }

    function uiFirst(vm) {
        var fileEl;

        ui.title("Edit Team Names");

        fileEl = document.getElementById("custom-teams");
        fileEl.addEventListener("change", function () {
            var file, reader;

            file = fileEl.files[0];

            reader = new window.FileReader();
            reader.readAsText(file);
            reader.onload = function (event) {
                var i, newTeams, rosters;

                rosters = JSON.parse(event.target.result);
                newTeams = rosters.teams;

                // Validate teams
                if (newTeams.length < g.numTeams) {
                    console.log("ROSTER ERROR: Wrong number of teams");
                    return;
                }
                for (i = 0; i < newTeams.length; i++) {
                    if (i !== newTeams[i].tid) {
                        console.log("ROSTER ERROR: Wrong tid, team " + i);
                        return;
                    }
                    if (newTeams[i].cid < 0 || newTeams[i].cid > 1) {
                        console.log("ROSTER ERROR: Invalid cid, team " + i);
                        return;
                    }
                    if (newTeams[i].did < 0 || newTeams[i].did > 5) {
                        console.log("ROSTER ERROR: Invalid did, team " + i);
                        return;
                    }
                    if (typeof newTeams[i].region !== "string") {
                        console.log("ROSTER ERROR: Invalid region, team " + i);
                        return;
                    }
                    if (typeof newTeams[i].name !== "string") {
                        console.log("ROSTER ERROR: Invalid name, team " + i);
                        return;
                    }
                    if (typeof newTeams[i].abbrev !== "string") {
                        console.log("ROSTER ERROR: Invalid abbrev, team " + i);
                        return;
                    }

                    // Check for pop in either the root or the most recent season
                    if (!newTeams[i].hasOwnProperty("pop") && newTeams[i].hasOwnProperty("seasons")) {
                        newTeams[i].pop = newTeams[i].seasons[newTeams[i].seasons.length - 1].pop;
                    }

                    if (typeof newTeams[i].pop !== "number") {
                        console.log("ROSTER ERROR: Invalid pop, team " + i);
                        return;
                    }
                }

                g.dbl.transaction("teams", "readwrite").objectStore("teams").openCursor().onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    if (cursor) {
                        t = cursor.value;

                        t.cid = newTeams[t.tid].cid;
                        t.did = newTeams[t.tid].did;
                        t.region = newTeams[t.tid].region;
                        t.name = newTeams[t.tid].name;
                        t.abbrev = newTeams[t.tid].abbrev;
                        t.seasons[t.seasons.length - 1].pop = newTeams[t.tid].pop;
                        if (newTeams[t.tid].imgURL) {
                            t.imgURL = newTeams[t.tid].imgURL;
                        }

                        // Update meta cache of user's team
                        if (t.tid === g.userTid) {
                            db.updateMetaNameRegion(g.lid, t.name, t.region);
                        }

                        cursor.update(t);
                        cursor.continue();
                    } else {
                        // Updating cached values for team regions and team names for easy access.
                        db.setGameAttributes({
                            lastDbChange: Date.now(),
                            teamAbbrevsCache: _.pluck(newTeams, "abbrev"),
                            teamRegionsCache: _.pluck(newTeams, "region"),
                            teamNamesCache: _.pluck(newTeams, "name")
                        }, function () {
                            ui.realtimeUpdate();
                        });
                    }
                };
            };
        });
    }

    return bbgmView.init({
        id: "editTeamInfo",
        post: post,
        runBefore: [updateTeamInfo],
        uiFirst: uiFirst
    });
});