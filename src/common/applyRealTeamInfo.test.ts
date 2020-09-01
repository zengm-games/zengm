import assert from "assert";
import applyRealTeamInfo from "./applyRealTeamInfo";
import generate from "../worker/core/team/generate";
import testHelpers from "../test/helpers";
import helpers from "./helpers";
import type { RealTeamInfo } from "./types";

describe("common/applyRealTeamInfo", () => {
	beforeAll(async () => {
		testHelpers.resetG();
	});

	test("works with no seasons", () => {
		const teamsDefault = helpers.getTeamsDefault();
		const t = generate(teamsDefault[0]);
		assert.strictEqual(t.abbrev, "ATL");
		assert.strictEqual(t.region, "Atlanta");
		assert.strictEqual(t.name, "Gold Club");
		assert.strictEqual(t.pop, 5.3);
		assert.deepStrictEqual(t.colors, ["#5c4a99", "#f0e81c", "#211e1e"]);
		assert.strictEqual(t.imgURL, "/img/logos/ATL.png");
		t.srID = "foo";

		const realTeamInfo: RealTeamInfo = {
			foo: {
				abbrev: "FOO",
				region: "Foo",
				name: "Foofoo",
				pop: 2.5,
				colors: ["#000000", "#0000ff", "#ff0000"],
				imgURL: "/foo.png",
			},
		};

		applyRealTeamInfo(t, realTeamInfo, 2016);

		assert.strictEqual(t.abbrev, "FOO");
		assert.strictEqual(t.region, "Foo");
		assert.strictEqual(t.name, "Foofoo");
		assert.strictEqual(t.pop, 2.5);
		assert.deepStrictEqual(t.colors, ["#000000", "#0000ff", "#ff0000"]);
		assert.strictEqual(t.imgURL, "/foo.png");
	});

	test("works with season", () => {
		const teamsDefault = helpers.getTeamsDefault();
		const t = generate(teamsDefault[0]);
		t.srID = "foo";

		const realTeamInfo: RealTeamInfo = {
			foo: {
				abbrev: "FOO",
				region: "Foo",
				name: "Foofoo",
				pop: 2.5,
				colors: ["#000000", "#0000ff", "#ff0000"],
				imgURL: "/foo.png",
				seasons: {
					2014: {
						name: "Foo",
					},
					2016: {
						name: "Bar",
					},
				},
			},
		};

		applyRealTeamInfo(t, realTeamInfo, 2016);

		assert.strictEqual(t.abbrev, "FOO");
		assert.strictEqual(t.region, "Foo");
		assert.strictEqual(t.name, "Bar");
		assert.strictEqual(t.pop, 2.5);
		assert.deepStrictEqual(t.colors, ["#000000", "#0000ff", "#ff0000"]);
		assert.strictEqual(t.imgURL, "/foo.png");
	});

	test("ignores future season", () => {
		const teamsDefault = helpers.getTeamsDefault();
		const t = generate(teamsDefault[0]);
		t.srID = "foo";

		const realTeamInfo: RealTeamInfo = {
			foo: {
				abbrev: "FOO",
				region: "Foo",
				name: "Foofoo",
				pop: 2.5,
				colors: ["#000000", "#0000ff", "#ff0000"],
				imgURL: "/foo.png",
				seasons: {
					2014: {
						name: "Foo",
					},
					2016: {
						name: "Bar",
					},
				},
			},
		};

		applyRealTeamInfo(t, realTeamInfo, 2000);

		assert.strictEqual(t.abbrev, "FOO");
		assert.strictEqual(t.region, "Foo");
		assert.strictEqual(t.name, "Foofoo");
		assert.strictEqual(t.pop, 2.5);
		assert.deepStrictEqual(t.colors, ["#000000", "#0000ff", "#ff0000"]);
		assert.strictEqual(t.imgURL, "/foo.png");
	});
});
