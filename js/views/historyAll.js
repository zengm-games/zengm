var g = require('../globals');
var ui = require('../ui');
var Promise = require('bluebird');
var $ = require('jquery');
var ko = require('knockout');
var team = require('../core/team');
var bbgmView = require('../util/bbgmView');
var helpers = require('../util/helpers');

var mapping;

mapping = {
    seasons: {
        create: function (options) {
            return options.data;
        }
    }
};

function updateHistory(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0) {
        return Promise.all([
            g.dbl.awards.getAll(),
            team.filter({
                attrs: ["tid", "abbrev", "region", "name"],
                seasonAttrs: ["season", "playoffRoundsWon", "won", "lost"]
            })
        ]).spread(function (awards, teams) {
            var championshipsByTid, i, seasons;

            seasons = [];
            for (i = 0; i < awards.length; i++) {
                seasons[i] = {
                    season: awards[i].season,
                    finalsMvp: awards[i].finalsMvp,
                    mvp: awards[i].mvp,
                    dpoy: awards[i].dpoy,
                    roy: awards[i].roy
                };
            }

            teams.forEach(function (t) {
                var found, i, j;

                // t.seasons has same season entries as the "seasons" array built from awards
                for (i = 0; i < seasons.length; i++) {
                    // Find corresponding entries in seasons and t.seasons. Can't assume they are the same because they aren't if some data has been deleted (Improve Performance)
                    found = false;
                    for (j = 0; j < t.seasons.length; j++) {
                        if (t.seasons[j].season === seasons[i].season) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        continue;
                    }

                    if (t.seasons[j].playoffRoundsWon === 4) {
                        seasons[i].champ = {
                            tid: t.tid,
                            abbrev: t.abbrev,
                            region: t.region,
                            name: t.name,
                            won: t.seasons[j].won,
                            lost: t.seasons[j].lost
                        };
                    } else if (t.seasons[j].playoffRoundsWon === 3) {
                        seasons[i].runnerUp = {
                            abbrev: t.abbrev,
                            region: t.region,
                            name: t.name,
                            won: t.seasons[j].won,
                            lost: t.seasons[j].lost
                        };
                    }
                }
            });

            // Count up number of championships per team
            championshipsByTid = [];
            for (i = 0; i < g.numTeams; i++) {
                championshipsByTid.push(0);
            }
            for (i = 0; i < seasons.length; i++) {
                if (seasons[i].champ) {
                    championshipsByTid[seasons[i].champ.tid] += 1;
                    seasons[i].champ.count = championshipsByTid[seasons[i].champ.tid];
                    delete seasons[i].champ.tid;
                }
            }

            return {
                seasons: seasons
            };
        });
    }
}

function uiFirst(vm) {
    var awardName, teamName;

    ui.title("League History");

    awardName = function (award, season) {
        if (!award) {
            // For old seasons with no Finals MVP
            return 'N/A';
        }

        return helpers.playerNameLabels(award.pid, award.name) + ' (<a href="' + helpers.leagueUrl(["roster", g.teamAbbrevsCache[award.tid], season]) + '">' + g.teamAbbrevsCache[award.tid] + '</a>)';
    };
    teamName = function (t, season) {
        if (t) {
            return '<a href="' + helpers.leagueUrl(["roster", t.abbrev, season]) + '">' + t.region + '</a> (' + t.won + '-' + t.lost + ')';
        }

        // This happens if there is missing data, such as from Improve Performance
        return 'N/A';
    };

    ko.computed(function () {
        ui.datatable($("#history-all"), 0, vm.seasons().map(function (s) {
            var countText, seasonLink;

            if (s.champ) {
                seasonLink = '<a href="' + helpers.leagueUrl(["history", s.season]) + '">' + s.season + '</a>';
                countText = ' - ' + helpers.ordinal(s.champ.count) + ' title';
            } else {
                // This happens if there is missing data, such as from Improve Performance
                seasonLink = String(s.season);
                countText = '';
            }

            return [seasonLink, teamName(s.champ, s.season) + countText, teamName(s.runnerUp, s.season), awardName(s.finalsMvp, s.season), awardName(s.mvp, s.season), awardName(s.dpoy, s.season), awardName(s.roy, s.season)];
        }));
    }).extend({throttle: 1});
}

module.exports = bbgmView.init({
    id: "historyAll",
    mapping: mapping,
    runBefore: [updateHistory],
    uiFirst: uiFirst
});
