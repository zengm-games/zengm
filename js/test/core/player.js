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
        });
    });
});