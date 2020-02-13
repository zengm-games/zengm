import assert from "assert";
import { PLAYER } from "../../common";
import g from "./g";
import helpers from "./helpers";

describe("worker/util/helpers", () => {
	beforeAll(() => {
		g.setWithoutSavingToDB("userTid", 4);
		g.setWithoutSavingToDB("teamAbbrevsCache", [
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
		]);
		g.setWithoutSavingToDB("teamRegionsCache", [
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
		]);
		g.setWithoutSavingToDB("teamNamesCache", [
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
		]);
		g.setWithoutSavingToDB("teamImgURLsCache", []);
	});

	// Relies on g.*Cache being populated
	describe("getAbbrev", () => {
		test("return abbrev when given valid team ID", () => {
			assert.equal(helpers.getAbbrev(6), "DAL");
			assert.equal(helpers.getAbbrev("6"), "DAL");
		});
		test('return "FA" for free agents', () => {
			assert.equal(helpers.getAbbrev(PLAYER.FREE_AGENT), "FA");
		});
	});
	describe("zeroPad", () => {
		const array = [1, 2, 3, 4, 5];

		test("do nothing if already long enough", () => {
			assert.deepEqual(helpers.zeroPad(array, 5), array);
		});

		test("slice if too long", () => {
			assert.deepEqual(helpers.zeroPad(array, 3), [1, 2, 3]);
		});

		test("pad with nulls up to requested length if too short", () => {
			assert.deepEqual(helpers.zeroPad(array, 6), [1, 2, 3, 4, 5, 0]);
			assert.deepEqual(helpers.zeroPad(array, 8), [1, 2, 3, 4, 5, 0, 0, 0]);
		});
	});
});
