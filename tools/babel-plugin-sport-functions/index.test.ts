import { assert, describe, test } from "vitest";
import { transformSync } from "@babel/core";
import { babelPluginSportFunctionsFactory } from "./index.ts";

const babelPluginSportFunctions =
	babelPluginSportFunctionsFactory("basketball");

const compare = (input: string, output: string) => {
	const compiled = transformSync(input, {
		babelrc: false,
		configFile: false,
		plugins: [babelPluginSportFunctions],
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
