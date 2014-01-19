/**
 * @name test.util.helpers
 * @namespace Tests for util.helpers.
 */
define(["globals", "util/helpers"], function (g, helpers) {
    "use strict";

    describe("util/helpers", function () {
        before(function (done) {
            g.userTid = 4;
            g.startingSeason = 2007;
            g.season = 2009;
            done();
        });

        describe("#validateAbbrev()", function () {
            it("should return team ID and abbrev when given valid abbrev", function () {
                var out;

                out = helpers.validateAbbrev("DAL");
                out[0].should.equal(6);
                out[1].should.equal("DAL");
            });
            it("should return user team ID and abbrev on invalid input", function () {
                var out;

                out = helpers.validateAbbrev("fuck");
                out[0].should.equal(4);
                out[1].should.equal("CIN");
                out = helpers.validateAbbrev();
                out[0].should.equal(4);
                out[1].should.equal("CIN");
            });
        });

        describe("#validateTid()", function () {
            it("should return team ID and abbrev when given valid team ID", function () {
                var out;

                out = helpers.validateTid(6);
                out[0].should.equal(6);
                out[1].should.equal("DAL");
                out = helpers.validateTid("6");
                out[0].should.equal(6);
                out[1].should.equal("DAL");
            });
            it("should return user team ID and abbrev on invalid input", function () {
                var out;

                out = helpers.validateTid("63");
                out[0].should.equal(4);
                out[1].should.equal("CIN");
                out = helpers.validateTid("fuck");
                out[0].should.equal(4);
                out[1].should.equal("CIN");
                out = helpers.validateTid();
                out[0].should.equal(4);
                out[1].should.equal("CIN");
            });
        });

        describe("#getAbbrev()", function () {
            it("should return abbrev when given valid team ID", function () {
                helpers.getAbbrev(6).should.equal("DAL");
                helpers.getAbbrev("6").should.equal("DAL");
            });
            it("should return user team abbrev on invalid input", function () {
                helpers.getAbbrev("fuck").should.equal("CIN");
                helpers.getAbbrev().should.equal("CIN");
            });
            it("should return \"FA\" for free agents", function () {
                helpers.getAbbrev(g.PLAYER.FREE_AGENT).should.equal("FA");
            });
        });

        describe("#validateSeason()", function () {
            it("should return input season when given a valid season", function () {
                helpers.validateSeason(2008).should.equal(2008);
                helpers.validateSeason("2008").should.equal(2008);
            });
            it("should return current season on invalid input", function () {
                helpers.validateSeason("fuck").should.equal(2009);
                helpers.validateSeason().should.equal(2009);
            });
        });

        describe("#getSeasons()", function () {
            it("should return array with values for each season since g.startingSeason", function () {
                var i, seasons;
                seasons = helpers.getSeasons();
                seasons.length.should.equal(g.season - g.startingSeason + 1);
                for (i = 0; i < seasons.length; i++) {
                    seasons[i].selected.should.equal(false);
                }
            });
            it("should select season", function () {
                var i, seasons;
                seasons = helpers.getSeasons(g.startingSeason);
                for (i = 0; i < seasons.length; i++) {
                    if (seasons[i].season === g.startingSeason) {
                        seasons[i].selected.should.equal(true);
                    } else {
                        seasons[i].selected.should.equal(false);
                    }
                }
            });
            it("should ignore season", function () {
                helpers.getSeasons(undefined, g.season).length.should.equal(g.season - g.startingSeason + 1 - 1);
            });
        });

        describe("#getTeamsDefault()", function () {
            it("should return correct length array", function () {
                helpers.getTeamsDefault().length.should.equal(g.numTeams);
            });
            // This is now getTeams and it requires DB access
            /*it("should select team", function () {
                var i, teams;
                teams = helpers.getTeams(25);
                for (i = 0; i < teams.length; i++) {
                    if (teams[i].tid === 25) {
                        teams[i].selected.should.equal(true);
                    } else {
                        teams[i].selected.should.equal(false);
                    }
                }
            });*/
        });

        describe("#deepCopy()", function () {
            var obj;
            obj = {a: 5, b: "hi", c: [1, 2, 3]};
            it("should return same object as input", function () {
                JSON.stringify(helpers.deepCopy(obj)).should.equal(JSON.stringify(obj));
            });
            it("should not let changes in output propagate to input", function () {
                var obj2;
                obj2 = helpers.deepCopy(obj);
                obj2.a = 2;
                JSON.stringify(obj2).should.not.equal(JSON.stringify(obj));
            });
            it("should not let changes in input propagate to output", function () {
                var obj2;
                obj2 = helpers.deepCopy(obj);
                obj.a = 2;
                JSON.stringify(obj2).should.not.equal(JSON.stringify(obj));
            });
        });

        describe("#round()", function () {
            it("should work with default precision", function () {
                helpers.round(20.5827).should.equal("21");
                helpers.round("205.227").should.equal("205");
            });
            it("should work with user-supplied precision", function () {
                helpers.round(20.5827, 3).should.equal("20.583");
                helpers.round("20.5827", 1).should.equal("20.6");
            });
        });

        describe("#nullPad()", function () {
            var array;
            array = [1, 2, 3, 4, 5];
            it("should do nothing if already long enough", function () {
                JSON.stringify(helpers.nullPad(array, 5)).should.equal(JSON.stringify(array));
            });
            it("should slice if too long", function () {
                JSON.stringify(helpers.nullPad(array, 3)).should.equal(JSON.stringify([1, 2, 3]));
            });
            it("should pad with nulls up to requested length if too short", function () {
                JSON.stringify(helpers.nullPad(array, 6)).should.equal(JSON.stringify([1, 2, 3, 4, 5, null]));
                JSON.stringify(helpers.nullPad(array, 8)).should.equal(JSON.stringify([1, 2, 3, 4, 5, null, null, null]));
            });
        });

        describe("#formatCurrency()", function () {
            it("should work with no extra options", function () {
                helpers.formatCurrency(52.766).should.equal("$52.77");
                helpers.formatCurrency("2.7").should.equal("$2.70");
            });
            it("should append a string, if supplied", function () {
                helpers.formatCurrency(64363.764376, "Q").should.equal("$64363.76Q");
                helpers.formatCurrency(".794", "whatever").should.equal("$0.79whatever");
            });
            it("should round to any precision", function () {
                helpers.formatCurrency(64363.764376, "Q", 5).should.equal("$64363.76438Q");
                helpers.formatCurrency(".794", "whatever", 0).should.equal("$1whatever");
            });
        });

        describe("#numberWithCommas()", function () {
            it("should work", function () {
                helpers.numberWithCommas(5823795234).should.equal("5,823,795,234");
                helpers.numberWithCommas(582.3795234).should.equal("582");
                helpers.numberWithCommas("5823795234").should.equal("5,823,795,234");
                helpers.numberWithCommas("582.3795234").should.equal("582");
            });
        });
    });
});