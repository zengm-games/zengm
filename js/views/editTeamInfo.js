/**
 * @name views.editTeamInfo
 * @namespace Edit Team Info.
 */
'use strict';

var dao = require('../dao');
var db = require('../db');
var g = require('../globals');
var ui = require('../ui');
var league = require('../core/league');
var team = require('../core/team');
var _ = require('underscore');
var bbgmView = require('../util/bbgmView');
var helpers = require('../util/helpers');

function post(req) {
    var button, userName, userRegion;

    button = document.getElementById("edit-team-info");
    button.disabled = true;

    dao.teams.iterate({
        ot: dao.tx("teams", "readwrite"),
        callback: function (t) {
            t.abbrev = req.params.abbrev[t.tid];
            t.region = req.params.region[t.tid];
            t.name = req.params.name[t.tid];
            t.seasons[t.seasons.length - 1].pop = parseFloat(req.params.pop[t.tid]);

            if (t.tid === g.userTid) {
                userName = t.name;
                userRegion = t.region;
            }

            return t;
        }
    }).then(function () {
        // Update meta cache of user's team
        return league.updateMetaNameRegion(userName, userRegion);
    }).then(function () {
        return league.setGameAttributesComplete({
            teamAbbrevsCache: req.params.abbrev,
            teamRegionsCache: req.params.region,
            teamNamesCache: req.params.name
        });
    }).then(function () {
        league.updateLastDbChange();
        button.disabled = false;
        ui.realtimeUpdate([], helpers.leagueUrl(["edit_team_info"]));
    });
}

function updateTeamInfo() {
    return team.filter({
        attrs: ["tid", "abbrev", "region", "name"],
        seasonAttrs: ["pop"],
        season: g.season
    }).then(function (teams) {
        var i;

        for (i = 0; i < teams.length; i++) {
            teams[i].pop = helpers.round(teams[i].pop, 6);
        }

        return {
            teams: teams
        };
    });
}

function uiFirst() {
    var fileEl;

    ui.title("Edit Team Names");

    fileEl = document.getElementById("custom-teams");
    fileEl.addEventListener("change", function () {
        var file, reader;

        file = fileEl.files[0];

        reader = new window.FileReader();
        reader.readAsText(file);
        reader.onload = function (event) {
            var i, newTeams, rosters, userName, userRegion;

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

            dao.teams.iterate({
                ot: dao.tx("teams", "readwrite"),
                callback: function (t) {
                    t.cid = newTeams[t.tid].cid;
                    t.did = newTeams[t.tid].did;
                    t.region = newTeams[t.tid].region;
                    t.name = newTeams[t.tid].name;
                    t.abbrev = newTeams[t.tid].abbrev;
                    t.seasons[t.seasons.length - 1].pop = newTeams[t.tid].pop;
                    if (newTeams[t.tid].imgURL) {
                        t.imgURL = newTeams[t.tid].imgURL;
                    }

                    if (t.tid === g.userTid) {
                        userName = t.name;
                        userRegion = t.region;
                    }

                    return t;
                }
            }).then(function () {
                // Update meta cache of user's team
                return league.updateMetaNameRegion(userName, userRegion);
            }).then(function () {
                return league.setGameAttributesComplete({
                    teamAbbrevsCache: _.pluck(newTeams, "abbrev"),
                    teamRegionsCache: _.pluck(newTeams, "region"),
                    teamNamesCache: _.pluck(newTeams, "name")
                });
            }).then(function () {
                league.updateLastDbChange();
                ui.realtimeUpdate(["dbChange"]);
            });
        };
    });
}

module.exports = bbgmView.init({
    id: "editTeamInfo",
    post: post,
    runBefore: [updateTeamInfo],
    uiFirst: uiFirst
});
