import { assert, beforeAll, describe, test } from "vitest";
import { PLAYER } from "../../common/index.ts";
import g from "./g.ts";
import helpers from "./helpers.ts";

beforeAll(() => {
	g.setWithoutSavingToDB("userTid", 4);
	const teams = helpers.getTeamsDefault();
	g.setWithoutSavingToDB(
		"teamInfoCache",
		teams.map((t) => ({
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

describe("stripBbcode", () => {
	test("stripBbcode", () => {
		const target = "https://i.ibb.co/HTGQNH5P/RIO.png";

		const inputs = [
			"[url=https://imgbb.com/][img]https://i.ibb.co/HTGQNH5P/RIO.png[/img][/url]",
			"[img]https://i.ibb.co/HTGQNH5P/RIO.png[/img]",
			'[img param=4 otherparam="aaa"]https://i.ibb.co/HTGQNH5P/RIO.png[/img]',
			"  [img]https://i.ibb.co/HTGQNH5P/RIO.png[/img]",
			"[img]https://i.ibb.co/HTGQNH5P/RIO.png[/img]  ",
			"https://i.ibb.co/HTGQNH5P/RIO.png",
		];

		for (const input of inputs) {
			assert.strictEqual(helpers.stripBbcode(input), target);
		}
	});
});
