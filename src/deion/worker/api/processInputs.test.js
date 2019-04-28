// @flow

import assert from "assert";
import { g } from "../util";
import { validateAbbrev, validateSeason } from "./processInputs";

describe("worker/api/processInputs", () => {
    before(() => {
        g.userTid = 4;
        g.season = 2009;
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
            "Blizzard",
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
    describe("validateAbbrev", () => {
        it("return team ID and abbrev when given valid abbrev", () => {
            const out = validateAbbrev("DAL");
            assert.equal(out[0], 6);
            assert.equal(out[1], "DAL");
        });
        it("return user team ID and abbrev on invalid input", () => {
            let out = validateAbbrev("fuck");
            assert.equal(out[0], 4);
            assert.equal(out[1], "CIN");
            out = validateAbbrev();
            assert.equal(out[0], 4);
            assert.equal(out[1], "CIN");
        });
    });

    describe("validateSeason", () => {
        it("return input season when given a valid season", () => {
            assert.equal(validateSeason(2008), 2008);
            assert.equal(validateSeason("2008"), 2008);
        });
        it("return current season on invalid input", () => {
            assert.equal(validateSeason("fuck"), 2009);
            assert.equal(validateSeason(), 2009);
        });
    });
});
