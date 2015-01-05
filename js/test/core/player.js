/**
 * @name test.core.player
 * @namespace Tests for core.player.
 */
/*eslint no-unused-expressions: 0*/
define(["globals", "core/player", "lib/underscore", "util/helpers"], function (g, player, _, helpers) {
    "use strict";

    // Synchronous version of player.addStatsRow which does not require IndexedDB
    function addStatsRow(p, playoffs) {
        playoffs = playoffs !== undefined ? playoffs : false;

        p.stats.push({season: g.season, tid: p.tid, playoffs: playoffs, gp: 0, gs: 0, min: 0, fg: 0, fga: 0, fgAtRim: 0, fgaAtRim: 0, fgLowPost: 0, fgaLowPost: 0, fgMidRange: 0, fgaMidRange: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, trb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, per: 0, ewa: 0});
        p.statsTids.push(p.tid);
        p.statsTids = _.uniq(p.statsTids);

        return p;
    }

    // Default values needed
    g.teamAbbrevsCache = _.pluck(helpers.getTeamsDefault(), "abbrev");
    g.numTeams = 30;

    describe("core/player", function () {
        describe("#generate()", function () {
            it.skip("should add stats row only for players generated on teams, not free agents or undrafted players", function () {
// Needs DB to check since stats are not in player object anymore
                var p;

                p = player.generate(-2, 19, "", 25, 55, 2012, false, 15.5);
                p.stats.length.should.equal(0);

                p = player.generate(-1, 19, "", 25, 55, 2012, false, 15.5);
                p.stats.length.should.equal(0);

                p = player.generate(0, 19, "", 25, 55, 2012, false, 15.5);
                p.stats.length.should.equal(1);

                p = player.generate(15, 19, "", 25, 55, 2012, false, 15.5);
                p.stats.length.should.equal(1);
            });
        });

        describe("#madeHof()", function () {
            it("should correctly assign players to the Hall of Fame", function () {
                var p;

                // Like player from http://www.reddit.com/r/BasketballGM/comments/222k8b/so_a_10x_dpoy_apparently_doesnt_have_what_it/
                p = player.generate(0, 19, "", 25, 55, 2012, false, 15.5);
                p.pos = "C";
                p.stats = [{
                    min: 1 * 2.6,
                    per: 18.7,
                    ewa: 0
                }, {
                    min: 77 * 19.3,
                    per: 13,
                    ewa: 1.1
                }, {
                    min: 82 * 26,
                    per: 18.9,
                    ewa: 6.6
                }, {
                    min: 82 * 33.9,
                    per: 15.3,
                    ewa: 4.7
                }, {
                    min: 79 * 33.8,
                    per: 16,
                    ewa: 5.3
                }, {
                    min: 81 * 31,
                    per: 17.1,
                    ewa: 6.1
                }, {
                    min: 80 * 28,
                    per: 16.2,
                    ewa: 4.6
                }, {
                    min: 82 * 34.1,
                    per: 16.6,
                    ewa: 6.2
                }, {
                    min: 80 * 34.8,
                    per: 16.9,
                    ewa: 6.5
                }, {
                    min: 82 * 31.7,
                    per: 17.8,
                    ewa: 7
                }, {
                    min: 81 * 33.5,
                    per: 18.8,
                    ewa: 8.3
                }, {
                    min: 82 * 32,
                    per: 17.8,
                    ewa: 7
                }, {
                    min: 82 * 30.5,
                    per: 17,
                    ewa: 5.9
                }, {
                    min: 76 * 30.6,
                    per: 16.3,
                    ewa: 4.8
                }, {
                    min: 82 * 30.8,
                    per: 16,
                    ewa: 5
                }, {
                    min: 82 * 28,
                    per: 15.6,
                    ewa: 4.1
                }];

                player.madeHof(p).should.be.false;
            });
        });

        describe("#filter()", function () {
            var p;

            before(function () {
                g.season = 2011;
                p = player.generate(g.PLAYER.UNDRAFTED, 19, "", 50, 60, 2011, false, 28);
                p.stats = []; // Fake it being here
                p.tid = 4;

                g.season = 2012;
// Replace with static array of stats row in helper function addStatsRow
                p = addStatsRow(p);
                p = player.addRatingsRow(p, 15);

                p.contract.exp = g.season + 1;

                p.stats[0].gp = 5;
                p.stats[0].fg = 20;
                p = addStatsRow(p, true);
                p.stats[1].gp = 3;
                p.stats[1].fg = 30;
                p = addStatsRow(p);
                p.stats[2].season = 2013;
                p.stats[2].tid = 0;
                p.stats[2].gp = 8;
                p.stats[2].fg = 56;

                p = player.addRatingsRow(p, 15);
                p.ratings[2].season = 2013;
                p = player.addRatingsRow(p, 15);
                p.ratings[3].season = 2014;
            });

            it("should return requested info if tid/season match", function () {
                var pf;

                pf = player.filter(p, {
                    attrs: ["tid", "awards"],
                    ratings: ["season", "ovr"],
                    stats: ["season", "abbrev", "fg", "fgp", "per"],
                    tid: 4,
                    season: 2012
                });

                pf.tid.should.equal(4);
                pf.awards.should.have.length(0);
                pf.ratings.season.should.equal(2012);
                pf.ratings.ovr.should.be.a("number");
                Object.keys(pf.ratings).should.have.length(2);
                pf.stats.season.should.equal(2012);
                pf.stats.abbrev.should.equal("CIN");
                pf.stats.fg.should.be.a("number");
                pf.stats.fgp.should.be.a("number");
                pf.stats.per.should.be.a("number");
                Object.keys(pf.stats).should.have.length(5);

                pf.hasOwnProperty("statsPlayoffs").should.equal(false);
                pf.hasOwnProperty("careerStats").should.equal(false);
                pf.hasOwnProperty("careerStatsPlayoffs").should.equal(false);
            });
            it("should return requested info if tid/season match for an array of player objects", function () {
                var i, pf;

                pf = player.filter([p, p], {
                    attrs: ["tid", "awards"],
                    ratings: ["season", "ovr"],
                    stats: ["season", "abbrev", "fg", "fgp", "per"],
                    tid: 4,
                    season: 2012
                });

                for (i = 0; i < 2; i++) {
                    pf[i].tid.should.equal(4);
                    pf[i].awards.should.have.length(0);
                    pf[i].ratings.season.should.equal(2012);
                    pf[i].ratings.ovr.should.be.a("number");
                    Object.keys(pf[i].ratings).should.have.length(2);
                    pf[i].stats.season.should.equal(2012);
                    pf[i].stats.abbrev.should.equal("CIN");
                    pf[i].stats.fg.should.be.a("number");
                    pf[i].stats.fgp.should.be.a("number");
                    pf[i].stats.per.should.be.a("number");
                    Object.keys(pf[i].stats).should.have.length(5);

                    pf[i].hasOwnProperty("statsPlayoffs").should.equal(false);
                    pf[i].hasOwnProperty("careerStats").should.equal(false);
                    pf[i].hasOwnProperty("careerStatsPlayoffs").should.equal(false);
                }
            });
            it("should return requested info if tid/season match, even when no attrs requested", function () {
                var pf;

                pf = player.filter(p, {
                    ratings: ["season", "ovr"],
                    stats: ["season", "abbrev", "fg", "fgp", "per"],
                    tid: 4,
                    season: 2012
                });

                pf.ratings.season.should.equal(2012);
                pf.ratings.ovr.should.be.a("number");
                Object.keys(pf.ratings).should.have.length(2);
                pf.stats.season.should.equal(2012);
                pf.stats.abbrev.should.equal("CIN");
                pf.stats.fg.should.be.a("number");
                pf.stats.fgp.should.be.a("number");
                pf.stats.per.should.be.a("number");
                Object.keys(pf.stats).should.have.length(5);

                pf.hasOwnProperty("statsPlayoffs").should.equal(false);
                pf.hasOwnProperty("careerStats").should.equal(false);
                pf.hasOwnProperty("careerStatsPlayoffs").should.equal(false);
            });
            it("should return requested info if tid/season match, even when no ratings requested", function () {
                var pf;

                pf = player.filter(p, {
                    attrs: ["tid", "awards"],
                    stats: ["season", "abbrev", "fg", "fgp", "per"],
                    tid: 4,
                    season: 2012
                });

                pf.tid.should.equal(4);
                pf.awards.should.have.length(0);
                pf.hasOwnProperty("ratings").should.equal(false);
                pf.stats.season.should.equal(2012);
                pf.stats.abbrev.should.equal("CIN");
                pf.stats.fg.should.be.a("number");
                pf.stats.fgp.should.be.a("number");
                pf.stats.per.should.be.a("number");
                Object.keys(pf.stats).should.have.length(5);

                pf.hasOwnProperty("statsPlayoffs").should.equal(false);
                pf.hasOwnProperty("careerStats").should.equal(false);
                pf.hasOwnProperty("careerStatsPlayoffs").should.equal(false);
            });
            it("should return requested info if tid/season match, even when no stats requested", function () {
                var pf;

                pf = player.filter(p, {
                    attrs: ["tid", "awards"],
                    ratings: ["season", "ovr"],
                    tid: 4,
                    season: 2012
                });

                pf.tid.should.equal(4);
                pf.awards.should.have.length(0);
                pf.ratings.season.should.equal(2012);
                pf.ratings.ovr.should.be.a("number");
                Object.keys(pf.ratings).should.have.length(2);
                pf.hasOwnProperty("stats").should.equal(false);

                pf.hasOwnProperty("statsPlayoffs").should.equal(false);
                pf.hasOwnProperty("careerStats").should.equal(false);
                pf.hasOwnProperty("careerStatsPlayoffs").should.equal(false);
            });
            it("should return undefined if tid does not match any on record", function () {
                var pf;

                pf = player.filter(p, {
                    attrs: ["tid", "awards"],
                    ratings: ["season", "ovr"],
                    stats: ["season", "abbrev", "fg", "fgp", "per"],
                    tid: 5,
                    season: 2012
                });

                (typeof pf).should.equal("undefined");
            });
            it("should return undefined if season does not match any on record", function () {
                var pf;

                pf = player.filter(p, {
                    attrs: ["tid", "awards"],
                    ratings: ["season", "ovr"],
                    stats: ["season", "abbrev", "fg", "fgp", "per"],
                    tid: 4,
                    season: 2014
                });

                (typeof pf).should.equal("undefined");
            });
            it("should return season totals is options.totals is true, and per-game averages otherwise", function () {
                var pf;

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 4,
                    season: 2012,
                    totals: true
                });
                pf.stats.gp.should.equal(5);
                pf.stats.fg.should.equal(20);

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 4,
                    season: 2012
                });
                pf.stats.gp.should.equal(5);
                pf.stats.fg.should.equal(4);
            });
            it("should return stats and statsPlayoffs if options.playoffs is true", function () {
                var pf;

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 4,
                    season: 2012,
                    playoffs: true
                });
                pf.stats.gp.should.equal(5);
                pf.stats.fg.should.equal(4);
                pf.statsPlayoffs.gp.should.equal(3);
                pf.statsPlayoffs.fg.should.equal(10);
            });
            it("should not return undefined with options.showNoStats even if tid does not match any on record", function () {
                var pf;

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 5,
                    season: 2012,
                    showNoStats: true
                });
                (typeof pf).should.equal("object");
            });
            it("should return undefined with options.showNoStats if season does not match any on record", function () {
                var pf;

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 4,
                    season: 2015,
                    showNoStats: true
                });
                (typeof pf).should.equal("undefined");
            });
            it("should not return undefined with options.showRookies if the player was drafted this season", function () {
                var pf;

                g.season = 2011;
                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 5,
                    season: 2011,
                    showRookies: true
                });
                (typeof pf).should.equal("object");

                g.season = 2015;
                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 5,
                    season: 2011,
                    showRookies: true
                });
                (typeof pf).should.equal("undefined");

                g.season = 2012;
            });
            it("should fuzz ratings if options.fuzz is true", function () {
                var pf;

                pf = player.filter(p, {
                    ratings: ["ovr"],
                    tid: 4,
                    season: 2012,
                    fuzz: false
                });
                pf.ratings.ovr.should.equal(p.ratings[1].ovr);

                pf = player.filter(p, {
                    ratings: ["ovr"],
                    tid: 4,
                    season: 2012,
                    fuzz: true
                });
                // This will break if ovr + fuzz is over 100 (should check bounds), but that never happens in practice
                pf.ratings.ovr.should.equal(Math.round(p.ratings[1].ovr + p.ratings[1].fuzz));
            });
            it("should return stats from previous season if options.oldStats is true and current season has no stats record", function () {
                var pf;

                g.season = 2013;

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 0,
                    season: 2013,
                    oldStats: true
                });
                pf.stats.gp.should.equal(8);
                pf.stats.fg.should.equal(7);

                g.season = 2014;

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 0,
                    season: 2014,
                    oldStats: true
                });
                pf.stats.gp.should.equal(8);
                pf.stats.fg.should.equal(7);

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 0,
                    season: 2014,
                    oldStats: false
                });
                (typeof pf).should.equal("undefined");

                g.season = 2012;
            });
            it("should adjust cashOwed by options.numGamesRemaining", function () {
                var pf;

//                g.season = 2012; // Already set above

                pf = player.filter(p, {
                    attrs: ["cashOwed"],
                    tid: 4,
                    season: 2012,
                    numGamesRemaining: 82
                });
                pf.cashOwed.should.equal(p.contract.amount * 2 / 1000);

                pf = player.filter(p, {
                    attrs: ["cashOwed"],
                    tid: 4,
                    season: 2012,
                    numGamesRemaining: 41
                });
                pf.cashOwed.should.equal(p.contract.amount * 1.5 / 1000);

                pf = player.filter(p, {
                    attrs: ["cashOwed"],
                    tid: 4,
                    season: 2012,
                    numGamesRemaining: 0
                });
                pf.cashOwed.should.equal(p.contract.amount / 1000);
            });
            it("should return stats and ratings from all seasons and teams if no season or team is specified", function () {
                var pf;

                pf = player.filter(p, {
                    attrs: ["tid", "awards"],
                    ratings: ["season", "ovr"],
                    stats: ["season", "abbrev", "fg"],
                    totals: true
                });

                pf.tid.should.equal(4);
                pf.awards.should.have.length(0);
                pf.ratings[0].season.should.equal(2011);
                pf.ratings[0].ovr.should.be.a("number");
                pf.ratings[1].season.should.equal(2012);
                pf.ratings[1].ovr.should.be.a("number");
                pf.ratings[2].season.should.equal(2013);
                pf.ratings[2].ovr.should.be.a("number");
                pf.stats[0].season.should.equal(2012);
                pf.stats[0].abbrev.should.equal("CIN");
                pf.stats[0].fg.should.equal(20);
                pf.stats[1].season.should.equal(2013);
                pf.stats[1].abbrev.should.equal("ATL");
                pf.stats[1].fg.should.equal(56);
                pf.careerStats.fg.should.equal(76);

                pf.hasOwnProperty("statsPlayoffs").should.equal(false);
                pf.hasOwnProperty("careerStatsPlayoffs").should.equal(false);
            });
            it("should return stats and ratings from all seasons with a specific team if no season is specified but a team is", function () {
                var pf;

                pf = player.filter(p, {
                    attrs: ["tid", "awards"],
                    ratings: ["season", "ovr"],
                    stats: ["season", "abbrev", "fg"],
                    tid: 4,
                    totals: true
                });

                pf.tid.should.equal(4);
                pf.awards.should.have.length(0);
                pf.ratings[0].season.should.equal(2012);
                pf.ratings[0].ovr.should.be.a("number");
                pf.ratings.should.have.length(1);
                pf.stats[0].season.should.equal(2012);
                pf.stats[0].abbrev.should.equal("CIN");
                pf.stats[0].fg.should.equal(20);
                pf.stats.should.have.length(1);
                pf.careerStats.fg.should.equal(20);

                pf.hasOwnProperty("statsPlayoffs").should.equal(false);
                pf.hasOwnProperty("careerStatsPlayoffs").should.equal(false);
            });
        });
    });
});