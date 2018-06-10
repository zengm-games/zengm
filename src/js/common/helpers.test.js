// @flow

import assert from "assert";
import { before, describe, it } from "mocha";
import { PLAYER, g, helpers } from ".";

describe("common/helpers", () => {
    before(() => {
        g.userTid = 4;
        g.teamAbbrevsCache = [
            "ATL",
            "BAL",
            "BOS",
            "CHI",
            "CIN",
            "CLE",
            "DAL",
            "DEN",
            "DET",
            "HOU",
            "LV",
            "LA",
            "MXC",
            "MIA",
            "MIN",
            "MON",
            "NYC",
            "PHI",
            "PHO",
            "PIT",
            "POR",
            "SAC",
            "SD",
            "SF",
            "SEA",
            "STL",
            "TPA",
            "TOR",
            "VAN",
            "WAS",
        ];
        g.teamRegionsCache = [
            "Atlanta",
            "Baltimore",
            "Boston",
            "Chicago",
            "Cincinnati",
            "Cleveland",
            "Dallas",
            "Denver",
            "Detroit",
            "Houston",
            "Las Vegas",
            "Los Angeles",
            "Mexico City",
            "Miami",
            "Minneapolis",
            "Montreal",
            "New York",
            "Philadelphia",
            "Phoenix",
            "Pittsburgh",
            "Portland",
            "Sacramento",
            "San Diego",
            "San Francisco",
            "Seattle",
            "St. Louis",
            "Tampa",
            "Toronto",
            "Vancouver",
            "Washington",
        ];
        g.teamNamesCache = [
            "Gold Club",
            "Crabs",
            "Massacre",
            "Whirlwinds",
            "Riots",
            "Curses",
            "Snipers",
            "High",
            "Muscle",
            "Apollos",
            "Blue Chips",
            "Earthquakes",
            "Aztecs",
            "Cyclones",
            "Blizzards",
            "Mounties",
            "Bankers",
            "Cheesesteaks",
            "Vultures",
            "Rivers",
            "Roses",
            "Gold Rush",
            "Pandas",
            "Venture Capitalists",
            "Symphony",
            "Spirits",
            "Turtles",
            "Beavers",
            "Whalers",
            "Monuments",
        ];
    });

    // Relies on g.*Cache being populated
    describe("getAbbrev", () => {
        it("return abbrev when given valid team ID", () => {
            assert.equal(helpers.getAbbrev(6), "DAL");
            assert.equal(helpers.getAbbrev("6"), "DAL");
        });
        it('return "FA" for free agents', () => {
            assert.equal(helpers.getAbbrev(PLAYER.FREE_AGENT), "FA");
        });
    });

    describe("getTeamsDefault", () => {
        it("return correct length array", () => {
            assert.equal(helpers.getTeamsDefault().length, 30);
        });
    });

    describe("deepCopy", () => {
        const obj = { a: 5, b: "hi", c: [1, 2, 3] };
        it("return same object as input", () => {
            assert.deepEqual(helpers.deepCopy(obj), obj);
        });
        it("don't let changes in output propagate to input", () => {
            const obj2 = helpers.deepCopy(obj);
            obj2.a = 2;
            assert.notDeepEqual(helpers.deepCopy(obj), obj2);
        });
        it("don't let changes in input propagate to output", () => {
            const obj2 = helpers.deepCopy(obj);
            obj.a = 2;
            assert.notDeepEqual(helpers.deepCopy(obj), obj2);
        });
    });

    describe("nullPad", () => {
        const array = [1, 2, 3, 4, 5];
        it("do nothing if already long enough", () => {
            assert.deepEqual(helpers.nullPad(array, 5), array);
        });
        it("slice if too long", () => {
            assert.deepEqual(helpers.nullPad(array, 3), [1, 2, 3]);
        });
        it("pad with nulls up to requested length if too short", () => {
            assert.deepEqual(helpers.nullPad(array, 6), [1, 2, 3, 4, 5, null]);
            assert.deepEqual(helpers.nullPad(array, 8), [
                1,
                2,
                3,
                4,
                5,
                null,
                null,
                null,
            ]);
        });
    });

    describe("formatCurrency", () => {
        it("work with no extra options", () => {
            assert.equal(helpers.formatCurrency(52.766), "$52.77");
        });
        it("append a string, if supplied", () => {
            assert.equal(
                helpers.formatCurrency(64363.764376, "Q"),
                "$64363.76Q",
            );
            assert.equal(
                helpers.formatCurrency(0.794, "whatever"),
                "$0.79whatever",
            );
        });
        it("round to any precision", () => {
            assert.equal(
                helpers.formatCurrency(64363.764376, "Q", 5),
                "$64363.76438Q",
            );
            assert.equal(
                helpers.formatCurrency(0.794, "whatever", 0),
                "$1whatever",
            );
        });
    });

    describe("numberWithCommas", () => {
        it("work", () => {
            assert.equal(helpers.numberWithCommas(5823795234), "5,823,795,234");
            assert.equal(helpers.numberWithCommas(582.3795234), "582");
            assert.equal(
                helpers.numberWithCommas("5823795234"),
                "5,823,795,234",
            );
            assert.equal(helpers.numberWithCommas("582.3795234"), "582");
        });
    });
});
