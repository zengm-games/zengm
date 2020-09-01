import assert from "assert";
import { g, helpers } from "../util";
import { validateAbbrev, validateSeason } from "./processInputs";

describe("worker/api/processInputs", () => {
	beforeAll(() => {
		g.setWithoutSavingToDB("userTid", 4);
		g.setWithoutSavingToDB("season", 2009);
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
	describe("validateAbbrev", () => {
		test("return team ID and abbrev when given valid abbrev", () => {
			const out = validateAbbrev("DAL");
			assert.strictEqual(out[0], 6);
			assert.strictEqual(out[1], "DAL");
		});

		test("return user team ID and abbrev on invalid input", () => {
			let out = validateAbbrev("fuck");
			assert.strictEqual(out[0], 4);
			assert.strictEqual(out[1], "CIN");
			out = validateAbbrev();
			assert.strictEqual(out[0], 4);
			assert.strictEqual(out[1], "CIN");
		});
	});
	describe("validateSeason", () => {
		test("return input season when given a valid season", () => {
			assert.strictEqual(validateSeason(2008), 2008);
			assert.strictEqual(validateSeason("2008"), 2008);
		});

		test("return current season on invalid input", () => {
			assert.strictEqual(validateSeason("fuck"), 2009);
			assert.strictEqual(validateSeason(), 2009);
		});
	});
});
