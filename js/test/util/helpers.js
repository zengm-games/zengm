'use strict';

var assert = require('assert');
var g = require('../../globals');
var helpers = require('../../util/helpers');

describe("util/helpers", function () {
    before(function () {
        g.userTid = 4;
        g.startingSeason = 2007;
        g.season = 2009;
    });

    // Relies on g.*Cache being populated
    describe.skip("#validateAbbrev()", function () {
        it("should return team ID and abbrev when given valid abbrev", function () {
            var out;

            out = helpers.validateAbbrev("DAL");
            assert.equal(out[0], 6);
            assert.equal(out[1], "DAL");
        });
        it("should return user team ID and abbrev on invalid input", function () {
            var out;

            out = helpers.validateAbbrev("fuck");
            assert.equal(out[0], 4);
            assert.equal(out[1], "CIN");
            out = helpers.validateAbbrev();
            assert.equal(out[0], 4);
            assert.equal(out[1], "CIN");
        });
    });

    // Relies on g.*Cache being populated
    describe.skip("#validateTid()", function () {
        it("should return team ID and abbrev when given valid team ID", function () {
            var out;

            out = helpers.validateTid(6);
            assert.equal(out[0], 6);
            assert.equal(out[1], "DAL");
            out = helpers.validateTid("6");
            assert.equal(out[0], 6);
            assert.equal(out[1], "DAL");
        });
        it("should return user team ID and abbrev on invalid input", function () {
            var out;

            out = helpers.validateTid("63");
            assert.equal(out[0], 4);
            assert.equal(out[1], "CIN");
            out = helpers.validateTid("fuck");
            assert.equal(out[0], 4);
            assert.equal(out[1], "CIN");
            out = helpers.validateTid();
            assert.equal(out[0], 4);
            assert.equal(out[1], "CIN");
        });
    });

    // Relies on g.*Cache being populated
    describe.skip("#getAbbrev()", function () {
        it("should return abbrev when given valid team ID", function () {
            assert.equal(helpers.getAbbrev(6), "DAL");
            assert.equal(helpers.getAbbrev("6"), "DAL");
        });
        it("should return user team abbrev on invalid input", function () {
            assert.equal(helpers.getAbbrev("fuck"), "CIN");
            assert.equal(helpers.getAbbrev(), "CIN");
        });
        it("should return \"FA\" for free agents", function () {
            assert.equal(helpers.getAbbrev(g.PLAYER.FREE_AGENT), "FA");
        });
    });

    describe("#validateSeason()", function () {
        it("should return input season when given a valid season", function () {
            assert.equal(helpers.validateSeason(2008), 2008);
            assert.equal(helpers.validateSeason("2008"), 2008);
        });
        it("should return current season on invalid input", function () {
            assert.equal(helpers.validateSeason("fuck"), 2009);
            assert.equal(helpers.validateSeason(), 2009);
        });
    });

    describe("#getSeasons()", function () {
        it("should return array with values for each season since g.startingSeason", function () {
            var i, seasons;
            seasons = helpers.getSeasons();
            assert.equal(seasons.length, g.season - g.startingSeason + 1);
            for (i = 0; i < seasons.length; i++) {
                assert.equal(seasons[i].selected, false);
            }
        });
        it("should select season", function () {
            var i, seasons;
            seasons = helpers.getSeasons(g.startingSeason);
            for (i = 0; i < seasons.length; i++) {
                if (seasons[i].season === g.startingSeason) {
                    assert.equal(seasons[i].selected, true);
                } else {
                    assert.equal(seasons[i].selected, false);
                }
            }
        });
        it("should ignore season", function () {
            assert.equal(helpers.getSeasons(undefined, g.season).length, g.season - g.startingSeason);
        });
    });

    describe("#getTeamsDefault()", function () {
        it("should return correct length array", function () {
            assert.equal(helpers.getTeamsDefault().length, 30);
        });
    });

    describe("#deepCopy()", function () {
        var obj;
        obj = {a: 5, b: "hi", c: [1, 2, 3]};
        it("should return same object as input", function () {
            assert.deepEqual(helpers.deepCopy(obj), obj);
        });
        it("should not let changes in output propagate to input", function () {
            var obj2;
            obj2 = helpers.deepCopy(obj);
            obj2.a = 2;
            assert.notDeepEqual(helpers.deepCopy(obj), obj2);
        });
        it("should not let changes in input propagate to output", function () {
            var obj2;
            obj2 = helpers.deepCopy(obj);
            obj.a = 2;
            assert.notDeepEqual(helpers.deepCopy(obj), obj2);
        });
    });

    describe("#round()", function () {
        it("should work with default precision", function () {
            assert.equal(helpers.round(20.5827), "21");
            assert.equal(helpers.round("205.227"), "205");
        });
        it("should work with user-supplied precision", function () {
            assert.equal(helpers.round(20.5827, 3), "20.583");
            assert.equal(helpers.round("20.5827", 1), "20.6");
        });
    });

    describe("#nullPad()", function () {
        var array;
        array = [1, 2, 3, 4, 5];
        it("should do nothing if already long enough", function () {
            assert.deepEqual(helpers.nullPad(array, 5), array);
        });
        it("should slice if too long", function () {
            assert.deepEqual(helpers.nullPad(array, 3), [1, 2, 3]);
        });
        it("should pad with nulls up to requested length if too short", function () {
            assert.deepEqual(helpers.nullPad(array, 6), [1, 2, 3, 4, 5, null]);
            assert.deepEqual(helpers.nullPad(array, 8), [1, 2, 3, 4, 5, null, null, null]);
        });
    });

    describe("#formatCurrency()", function () {
        it("should work with no extra options", function () {
            assert.equal(helpers.formatCurrency(52.766), "$52.77");
            assert.equal(helpers.formatCurrency("2.7"), "$2.70");
        });
        it("should append a string, if supplied", function () {
            assert.equal(helpers.formatCurrency(64363.764376, "Q"), "$64363.76Q");
            assert.equal(helpers.formatCurrency(".794", "whatever"), "$0.79whatever");
        });
        it("should round to any precision", function () {
            assert.equal(helpers.formatCurrency(64363.764376, "Q", 5), "$64363.76438Q");
            assert.equal(helpers.formatCurrency(".794", "whatever", 0), "$1whatever");
        });
    });

    describe("#numberWithCommas()", function () {
        it("should work", function () {
            assert.equal(helpers.numberWithCommas(5823795234), "5,823,795,234");
            assert.equal(helpers.numberWithCommas(582.3795234), "582");
            assert.equal(helpers.numberWithCommas("5823795234"), "5,823,795,234");
            assert.equal(helpers.numberWithCommas("582.3795234"), "582");
        });
    });
});
