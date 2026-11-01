import { assert, beforeAll, describe, test } from "vitest";
import { g, helpers } from "./index.ts";
import { validateSeason, validateTeam } from "./processInputs.ts";
import { PHASE } from "../../common/constants.ts";

beforeAll(() => {
	g.setWithoutSavingToDB("userTid", 4);
	g.setWithoutSavingToDB("season", 2009);
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
describe("validateTeam", () => {
	test("return tid when given valid abbrev", () => {
		assert.strictEqual(validateTeam("DAL"), 6);
	});

	test("use the tid rather than the abbrev when both are given", () => {
		assert.strictEqual(validateTeam("DAL_7"), 7);
	});

	test("return user tid on invalid input", () => {
		assert.strictEqual(validateTeam("fuck"), 4);
		assert.strictEqual(validateTeam(undefined), 4);
	});

	test("return allowed special values", () => {
		assert.strictEqual(validateTeam("watch", ["all", "watch"]), "watch");
		assert.strictEqual(validateTeam("DAL_6", ["all", "watch"]), 6);
	});

	test("don't return special values that aren't allowed", () => {
		assert.strictEqual(validateTeam("watch"), 4);
		assert.strictEqual(validateTeam("watch", ["all"]), "all");
	});

	test("fall back to all if it's allowed", () => {
		assert.strictEqual(validateTeam("fuck", ["all", "watch"]), "all");
		assert.strictEqual(validateTeam(undefined, ["all", "watch"]), "all");
	});

	test("only allow playoffs when there are remaining playoff teams", () => {
		g.setWithoutSavingToDB("nextPhase", undefined);
		g.setWithoutSavingToDB("phase", PHASE.DRAFT_LOTTERY);
		assert.strictEqual(validateTeam("playoffs", ["all", "playoffs"]), "all");
		g.setWithoutSavingToDB("phase", PHASE.PLAYOFFS);
		assert.strictEqual(
			validateTeam("playoffs", ["all", "playoffs"]),
			"playoffs",
		);
	});
});

describe("validateSeason", () => {
	test("return input season when given a valid season", () => {
		assert.strictEqual(validateSeason(2008), 2008);
		assert.strictEqual(validateSeason("2008"), 2008);
	});

	test("return current season on invalid input", () => {
		assert.strictEqual(validateSeason("fuck"), 2009);
		assert.strictEqual(validateSeason(undefined), 2009);
	});
});
