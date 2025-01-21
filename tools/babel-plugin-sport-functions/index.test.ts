import { assert, describe, test } from "vitest";
import * as babel from "@babel/core";
// @ts-expect-error
import babelPluginSportFunctions from "./index.cjs";

const transform = (input: string) => {
	return babel.transform(input, {
		filename: "test.js",
		plugins: [babelPluginSportFunctions],
	})!.code;
};

const compare = (input: string, output: string) => {
	const compiled = transform(input);
	assert.strictEqual(compiled, output);
};

describe("babel-plugin-sport-functions", function () {
	describe("isSport", () => {
		test("should replace isSport in if", () => {
			compare(
				`if (isSport("basketball")) {
  console.log("foo");
}`,
				`"use strict";

if (process.env.SPORT === "basketball") {
  console.log("foo");
}`,
			);
		});

		test("should replace !isSport in if", () => {
			compare(
				`if (!isSport("basketball")) {
  console.log("foo");
}`,
				`"use strict";

if (!(process.env.SPORT === "basketball")) {
  console.log("foo");
}`,
			);
		});

		test("should replace isSport in ternary", () => {
			compare(
				`isSport("basketball") ? 1 : 0;`,
				`"use strict";

process.env.SPORT === "basketball" ? 1 : 0;`,
			);
		});
	});

	describe("bySport", () => {
		test("should replace bySport", () => {
			compare(
				`const whatever = bySport({
  basketball: "basketball thing",
  football: "football thing",
  hockey: "hockey thing",
});`,
				`"use strict";

const whatever = process.env.SPORT === "basketball" ? "basketball thing" : process.env.SPORT === "football" ? "football thing" : "hockey thing";`,
			);
		});

		test("should replace bySport, with quoted properties", () => {
			compare(
				`const whatever = bySport({
  "basketball": "basketball thing",
  football: "football thing",
});`,
				`"use strict";

const whatever = process.env.SPORT === "basketball" ? "basketball thing" : "football thing";`,
			);
		});

		test("should replace bySport, with default if no matching sport", () => {
			compare(
				`const whatever = bySport({
  default: "default thing",
  basketball: "basketball thing",
});`,
				`"use strict";

const whatever = process.env.SPORT === "basketball" ? "basketball thing" : "default thing";`,
			);
		});
	});
});
