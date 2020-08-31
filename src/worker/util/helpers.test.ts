import assert from "assert";
import { PLAYER } from "../../common";
import g from "./g";
import helpers from "./helpers";

describe("worker/util/helpers", () => {
	beforeAll(() => {
		g.setWithoutSavingToDB("userTid", 4);
		const teams = helpers.getTeamsDefault();
		g.setWithoutSavingToDB(
			"teamInfoCache",
			teams.map(t => ({
				abbrev: t.abbrev,
				disabled: false,
				imgURL: t.imgURL,
				name: t.name,
				region: t.region,
			})),
		);
	});

	// Relies on g.*Cache being populated
	describe("getAbbrev", () => {
		test("return abbrev when given valid team ID", () => {
			assert.strictEqual(helpers.getAbbrev(6), "DAL");
			assert.strictEqual(helpers.getAbbrev("6"), "DAL");
		});
		test('return "FA" for free agents', () => {
			assert.strictEqual(helpers.getAbbrev(PLAYER.FREE_AGENT), "FA");
		});
	});
	describe("zeroPad", () => {
		const array = [1, 2, 3, 4, 5];

		test("do nothing if already long enough", () => {
			assert.deepStrictEqual(helpers.zeroPad(array, 5), array);
		});

		test("slice if too long", () => {
			assert.deepStrictEqual(helpers.zeroPad(array, 3), [1, 2, 3]);
		});

		test("pad with nulls up to requested length if too short", () => {
			assert.deepStrictEqual(helpers.zeroPad(array, 6), [1, 2, 3, 4, 5, 0]);
			assert.deepStrictEqual(helpers.zeroPad(array, 8), [
				1,
				2,
				3,
				4,
				5,
				0,
				0,
				0,
			]);
		});
	});
});
