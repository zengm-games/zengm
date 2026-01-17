import { assert, beforeAll, describe, test } from "vitest";
import { PLAYER } from "../../common/index.ts";
import g from "./g.ts";
import helpers from "./helpers.ts";
import type { ByConf } from "../../common/types.ts";

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

describe("roundsWonText", () => {
	const roundsWonText = (
		playoffRoundsWon: number,
		numPlayoffRounds: number,
		playoffsByConf: ByConf,
	) => {
		return helpers.roundsWonText({
			playoffRoundsWon,
			numPlayoffRounds,
			playoffsByConf,
		});
	};

	test("Default league, byConf", () => {
		assert.strictEqual(roundsWonText(-1, 4, 2), "");
		assert.strictEqual(roundsWonText(0, 4, 2), "made playoffs");
		assert.strictEqual(roundsWonText(1, 4, 2), "made conference semifinals");
		assert.strictEqual(roundsWonText(2, 4, 2), "made conference finals");
		assert.strictEqual(roundsWonText(3, 4, 2), "conference champs");
		assert.strictEqual(roundsWonText(4, 4, 2), "league champs");
	});

	test("Default league, no byConf", () => {
		assert.strictEqual(roundsWonText(-1, 4, false), "");
		assert.strictEqual(roundsWonText(0, 4, false), "made playoffs");
		assert.strictEqual(roundsWonText(1, 4, false), "made quarterfinals");
		assert.strictEqual(roundsWonText(2, 4, false), "made semifinals");
		assert.strictEqual(roundsWonText(3, 4, false), "made finals");
		assert.strictEqual(roundsWonText(4, 4, false), "league champs");
	});

	test("More conferences", () => {
		assert.strictEqual(roundsWonText(-1, 4, 4), "");
		assert.strictEqual(roundsWonText(0, 4, 4), "made playoffs");
		assert.strictEqual(roundsWonText(1, 4, 4), "made conference finals");
		assert.strictEqual(roundsWonText(2, 4, 4), "conference champs");
		assert.strictEqual(roundsWonText(3, 4, 4), "made finals");
		assert.strictEqual(roundsWonText(4, 4, 4), "league champs");

		assert.strictEqual(roundsWonText(-1, 4, 8), "");
		assert.strictEqual(roundsWonText(0, 4, 8), "made playoffs");
		assert.strictEqual(roundsWonText(1, 4, 8), "conference champs");
		assert.strictEqual(roundsWonText(2, 4, 8), "made semifinals");
		assert.strictEqual(roundsWonText(3, 4, 8), "made finals");
		assert.strictEqual(roundsWonText(4, 4, 8), "league champs");

		assert.strictEqual(roundsWonText(-1, 4, 16), "");
		assert.strictEqual(roundsWonText(0, 4, 16), "made playoffs");
		assert.strictEqual(roundsWonText(1, 4, 16), "made quarterfinals");
		assert.strictEqual(roundsWonText(2, 4, 16), "made semifinals");
		assert.strictEqual(roundsWonText(3, 4, 16), "made finals");
		assert.strictEqual(roundsWonText(4, 4, 16), "league champs");
	});
});
