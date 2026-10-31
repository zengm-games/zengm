import { assert, describe, test } from "vitest";
import { transformSync } from "@babel/core";
import babelPluginSyntaxTypescript from "@babel/plugin-syntax-typescript";
import { babelPluginSportFunctionsFactory } from "./index.ts";

const babelPluginSportFunctions =
	babelPluginSportFunctionsFactory("basketball");

const compare = (input: string, output: string) => {
	const compiled = transformSync(input, {
		babelrc: false,
		configFile: false,
		// Same as tools/lib/rolldownPlugins/sportFunctions.ts, where TypeScript syntax is still present
		plugins: [babelPluginSyntaxTypescript, babelPluginSportFunctions],
	})!.code;
	assert.strictEqual(compiled, output);
};

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

	test("should replace bySport, with as const", () => {
		compare(
			`const whatever = bySport({
  basketball: ["a", "b"],
  football: ["c"],
} as const);`,
			`const whatever = ["a", "b"];`,
		);
	});

	test("should replace bySport, with satisfies", () => {
		compare(
			`const whatever = bySport({
  basketball: ["a", "b"],
  football: ["c"],
} satisfies Record<string, string[]>);`,
			`const whatever = ["a", "b"];`,
		);
	});

	test("should replace bySport, with type argument", () => {
		compare(
			`const whatever = bySport<string[]>({
  basketball: ["a", "b"],
  football: ["c"],
});`,
			`const whatever = ["a", "b"];`,
		);
	});
});
