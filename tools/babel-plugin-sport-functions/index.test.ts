import { assert, describe, test } from "vitest";
import { transform } from "@babel/core";
import { babelPluginSportFunctions } from "./index.ts";

const compare = (input: string, output: string) => {
	const compiled = transform(input, {
		babelrc: false,
		configFile: false,
		filename: "test.js",
		plugins: [[babelPluginSportFunctions, { sport: "basketball" }]],
	})!.code;
	assert.strictEqual(compiled, output);
};

describe("isSport", () => {
	test("should replace isSport in if", () => {
		compare(
			`if (isSport("basketball")) {
  console.log("foo");
}`,
			`if (true) {
  console.log("foo");
}`,
		);
	});

	test("should replace isSport in if, for other sport", () => {
		compare(
			`if (isSport("football")) {
  console.log("foo");
}`,
			`if (false) {
  console.log("foo");
}`,
		);
	});

	test("should replace !isSport in if", () => {
		compare(
			`if (!isSport("basketball")) {
  console.log("foo");
}`,
			`if (!true) {
  console.log("foo");
}`,
		);
	});

	test("should replace isSport in ternary", () => {
		compare(`isSport("basketball") ? 1 : 0;`, `true ? 1 : 0;`);
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
			`const whatever = "basketball thing";`,
		);
	});

	test("should replace bySport, with quoted properties", () => {
		compare(
			`const whatever = bySport({
  "basketball": "basketball thing",
  football: "football thing",
});`,
			`const whatever = "basketball thing";`,
		);
	});

	test("should replace bySport, with default if no matching sport", () => {
		compare(
			`const whatever = bySport({
  football: "football thing",
  default: "default thing",
});`,
			`const whatever = "default thing";`,
		);
	});
});
