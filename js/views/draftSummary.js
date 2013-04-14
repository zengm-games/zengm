/**
 * @name views.playerStats
 * @namespace Player stats table.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "lib/underscore", "views/components", "util/helpers", "util/viewHelpers"], function (db, g, ui, $, ko, _, components, helpers, viewHelpers) {
    "use strict";

    var players, vm;

    function display(updateEvents, cb) {
        var leagueContentEl, season;

        season = vm.season();

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "draftSummary") {
            ui.update({
                container: "league_content",
                template: "draftSummary"
            });
            ko.applyBindings(vm, leagueContentEl);
        }
        ui.title(season + " Draft Summary");

        components.dropdown("draft-summary-dropdown", ["seasons"], [season], updateEvents);

        ui.datatableSinglePage($("#draft-results"), 0, _.map(players, function (p) {
            return [p.draft.round + '-' + p.draft.pick, '<a href="/l/' + g.lid + '/player/' + p.pid + '">' + p.name + '</a>', p.pos, '<a href="/l/' + g.lid + '/roster/' + p.draft.abbrev + '">' + p.draft.abbrev + '</a>', String(p.draft.age), String(p.draft.ovr), String(p.draft.pot), '<span class="skills_alone">' + helpers.skillsBlock(p.draft.skills) + '</span>', '<a href="/l/' + g.lid + '/roster/' + p.currentAbbrev + '">' + p.currentAbbrev + '</a>', String(p.currentAge), String(p.currentOvr), String(p.currentPot), '<span class="skills_alone">' + helpers.skillsBlock(p.currentSkills) + '</span>', helpers.round(p.careerStats.gp), helpers.round(p.careerStats.min, 1), helpers.round(p.careerStats.pts, 1), helpers.round(p.careerStats.trb, 1), helpers.round(p.careerStats.ast, 1), helpers.round(p.careerStats.per, 1)];
        }));

        cb();
    }

    function loadBefore(season, cb) {
        g.dbl.transaction("players").objectStore("players").index("draft.year").getAll(season).onsuccess = function (event) {
            var attributes, currentPr, data, i, pa, player, playersAll, ratings, stats;

            attributes = ["tid", "abbrev", "draft", "pid", "name", "pos", "age"];
            ratings = ["ovr", "pot", "skills"];
            stats = ["gp", "min", "pts", "trb", "ast", "per"];  // This needs to be in the same order as categories
            playersAll = db.getPlayers(event.target.result, null, null, attributes, stats, ratings, {showNoStats: true, fuzz: true});

            players = [];
            for (i = 0; i < playersAll.length; i++) {
                pa = playersAll[i];

                if (pa.draft.round === 1 || pa.draft.round === 2) {
                    // Attributes
                    player = {pid: pa.pid, name: pa.name, pos: pa.pos, draft: pa.draft, currentAge: pa.age, currentAbbrev: pa.abbrev};

                    // Ratings
                    currentPr = _.last(pa.ratings);
                    if (pa.tid !== g.PLAYER.RETIRED) {
                        player.currentOvr = currentPr.ovr;
                        player.currentPot = currentPr.pot;
                        player.currentSkills = currentPr.skills;
                    } else {
                        player.currentOvr = "";
                        player.currentPot = "";
                        player.currentSkills = "";
                    }

                    // Stats
                    player.careerStats = pa.careerStats;

                    players.push(player);
                }
            }

            vm.season(season);

            cb();
        };
    }

    function update(season, updateEvents, cb) {
        var leagueContentEl;

        leagueContentEl = document.getElementById("league_content");
        if (leagueContentEl.dataset.id !== "draftSummary") {
            ko.cleanNode(leagueContentEl);
            vm = {
                season: ko.observable()
            };
        }

        loadBefore(season, function () {
            display(updateEvents, cb);
        });
    }

    function get(req) {
        viewHelpers.beforeLeague(req, function (updateEvents, cb) {
            var season;

            season = helpers.validateSeason(req.params.season);

            // Draft hasn't happened yet this year
            if (g.phase < g.PHASE.DRAFT) {
                // View last season by default
                if (season >= g.season) {
                    season = g.season - 1;
                }
            }

            if (season < g.startingSeason) {
                return helpers.error("There is no draft history yet. Check back after the draft.", cb);
            }

            update(season, updateEvents, cb);
        });
    }

    return {
        update: update,
        get: get
    };
});