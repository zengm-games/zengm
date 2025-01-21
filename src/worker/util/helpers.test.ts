import { assert, beforeAll, describe, test } from "vitest";
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
				imgURLSmall: t.imgURLSmall,
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

	describe("roundContract", () => {
		test("roundContract", () => {
			g.setWithoutSavingToDB("minContract", 10);
			assert.strictEqual(helpers.roundContract(123456789), 123456789);
			g.setWithoutSavingToDB("minContract", 100);
			assert.strictEqual(helpers.roundContract(123456789), 123456789);
			g.setWithoutSavingToDB("minContract", 299);
			assert.strictEqual(helpers.roundContract(123456789), 123456789);
			g.setWithoutSavingToDB("minContract", 300);
			assert.strictEqual(helpers.roundContract(123456789), 123456790);
			g.setWithoutSavingToDB("minContract", 1000);
			assert.strictEqual(helpers.roundContract(123456789), 123456790);
			g.setWithoutSavingToDB("minContract", 10000);
			assert.strictEqual(helpers.roundContract(123456789), 123456800);
			g.setWithoutSavingToDB("minContract", 100000);
			assert.strictEqual(helpers.roundContract(123456789), 123457000);
			assert.strictEqual(helpers.getAbbrev("6"), "DAL");
		});
	});
});
