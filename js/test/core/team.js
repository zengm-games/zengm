/**
 * @name test.core.team
 * @namespace Tests for core.team.
 */
define(["db", "globals", "core/league", "core/team"], function (db, g, league, team) {
    "use strict";

    describe("core/team", function () {
        describe("#filter()", function () {
            var t;

            before(function (done) {
                db.connectMeta(function () {
                    league.create("Test", 0, "random", function () {
                        g.dbl.transaction("teams", "readwrite").objectStore("teams").openCursor(4).onsuccess = function (event) {
                            var cursor, t;

                            cursor = event.target.result;
                            t = cursor.value;
                            t.stats[0].gp = 10;
                            t.stats[0].fg = 50;
                            t.stats[0].fga = 100;

                            cursor.update(t);

                            done();
                        };
                    });
                });
            });
            after(function (done) {
                league.remove(g.lid, done);
            });

            it("should return requested info if tid/season match", function (done) {
                var tf;

                team.filter({
                    attrs: ["tid", "abbrev"],
                    seasonAttrs: ["season", "won"],
                    stats: ["gp", "fg", "fgp"],
                    tid: 4,
                    season: g.season
                }, function (t) {
                    t.tid.should.equal(4);
                    t.abbrev.should.equal("CHI");
                    t.season.should.equal(g.season);
                    t.gp.should.equal(10);
                    t.fg.should.equal(5);
                    t.fgp.should.equal(50);
                    Object.keys(t).should.have.length(7);
                    t.hasOwnProperty("stats").should.equal(false);

                    done();
                });
            });
/*            it("should return requested info if tid/season match for an array of team objects", function () {
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

                t.ratings.season.should.equal(2012);
                t.ratings.ovr.should.be.a("number");
                Object.keys(t.ratings).should.have.length(2);
                t.stats.season.should.equal(2012);
                t.stats.abbrev.should.equal("CHI");
                t.stats.fg.should.be.a("number");
                t.stats.fgp.should.be.a("number");
                t.stats.per.should.be.a("number");
                Object.keys(t.stats).should.have.length(5);

                t.hasOwnProperty("statsPlayoffs").should.equal(false);
                t.hasOwnProperty("careerStats").should.equal(false);
                t.hasOwnProperty("careerStatsPlayoffs").should.equal(false);
            });
            it("should return requested info if tid/season match, even when no seasonAttrs requested", function () {
                var pf;

                pf = player.filter(p, {
                    attrs: ["tid", "awards"],
                    stats: ["season", "abbrev", "fg", "fgp", "per"],
                    tid: 4,
                    season: 2012
                });

                t.tid.should.equal(4);
                t.awards.should.have.length(0);
                t.hasOwnProperty("ratings").should.equal(false);
                t.stats.season.should.equal(2012);
                t.stats.abbrev.should.equal("CHI");
                t.stats.fg.should.be.a("number");
                t.stats.fgp.should.be.a("number");
                t.stats.per.should.be.a("number");
                Object.keys(t.stats).should.have.length(5);

                t.hasOwnProperty("statsPlayoffs").should.equal(false);
                t.hasOwnProperty("careerStats").should.equal(false);
                t.hasOwnProperty("careerStatsPlayoffs").should.equal(false);
            });
            it("should return requested info if tid/season match, even when no stats requested", function () {
                var pf;

                pf = player.filter(p, {
                    attrs: ["tid", "awards"],
                    ratings: ["season", "ovr"],
                    tid: 4,
                    season: 2012
                });
console.log(pf);

                t.tid.should.equal(4);
                t.awards.should.have.length(0);
                t.ratings.season.should.equal(2012);
                t.ratings.ovr.should.be.a("number");
                Object.keys(t.ratings).should.have.length(2);
                t.hasOwnProperty("stats").should.equal(false);

                t.hasOwnProperty("statsPlayoffs").should.equal(false);
                t.hasOwnProperty("careerStats").should.equal(false);
                t.hasOwnProperty("careerStatsPlayoffs").should.equal(false);
            });
            it("should return season totals is options.totals is true, and per-game averages otherwise", function () {
                var pf;

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 4,
                    season: 2012,
                    totals: true
                });
                t.stats.gp.should.equal(5);
                t.stats.fg.should.equal(20);

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 4,
                    season: 2012
                });
                t.stats.gp.should.equal(5);
                t.stats.fg.should.equal(4);
            });
            it("should return playoff stats if options.playoffs is true", function () {
                var pf;

                pf = player.filter(p, {
                    stats: ["gp", "fg"],
                    tid: 4,
                    season: 2012,
                    playoffs: true
                });
                t.stats.gp.should.equal(5);
                t.stats.fg.should.equal(4);
                t.statsPlayoffs.gp.should.equal(3);
                t.statsPlayoffs.fg.should.equal(10);
            });*/
        });
    });
});