/**
 * @name test.core.player
 * @namespace Tests for core.player.
 */
define(["db", "globals", "core/player"], function (db, g, player) {
    "use strict";

    describe("core/player", function () {
        describe("#generate()", function () {
            it("should add stats row only for players generated on teams, not free agents or undrafted players", function () {
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
        describe("#filter()", function () {
            var p;

            before(function () {
                g.season = 2012;
                p = player.generate(4, 19, "", 50, 60, 2012, false, 28);
                p.stats[0].gp = 5;
                p.stats[0].fg = 20;
                p = player.addStatsRow(p, true);
                p.stats[1].gp = 3;
                p.stats[1].fg = 30;

                p = player.addRatingsRow(p, 15);
                p.ratings[1].season = 2013;
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
                pf.stats.abbrev.should.equal("CHI");
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
                    pf[i].stats.abbrev.should.equal("CHI");
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
                pf.stats.abbrev.should.equal("CHI");
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
                pf.stats.abbrev.should.equal("CHI");
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
                    season: 2013
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

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 5,
                    season: 2012,
                    showRookies: true
                });
                (typeof pf).should.equal("object");

                g.season = 2015;
                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 5,
                    season: 2012,
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
                pf.ratings.ovr.should.equal(p.ratings[0].ovr);

                pf = player.filter(p, {
                    ratings: ["ovr"],
                    tid: 4,
                    season: 2012,
                    fuzz: true
                });
                // This will break if ovr + fuzz is over 100 (should check bounds), but that never happens in practice
                pf.ratings.ovr.should.equal(Math.round(p.ratings[0].ovr + p.ratings[0].fuzz));
            });
            it("should return stats from previous season if options.oldStats is true and current season has no stats record", function () {
                var pf;

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 4,
                    season: 2012,
                    oldStats: true
                });
                pf.stats.gp.should.equal(5);
                pf.stats.fg.should.equal(4);

                g.season = 2013;

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 4,
                    season: 2013,
                    oldStats: true
                });
                pf.stats.gp.should.equal(5);
                pf.stats.fg.should.equal(4);

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 4,
                    season: 2013,
                    oldStats: false
                });
                (typeof pf).should.equal("undefined");

                g.season = 2012;
            });
        });
    });
});