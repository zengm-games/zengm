import { rolldown, type RolldownPlugin } from "rolldown";
import { assert, describe, test } from "vitest";
import { sportFunctions } from "./sportFunctions.ts";
import { format } from "oxfmt";

const testFixturePlugin = (code: string): RolldownPlugin => {
	return {
		name: "test-fixture-plugin",

		resolveId(id) {
			if (id === "test-fixture") {
				// \0 is from https://github.com/rollup/rollup/wiki/Plugins/d8fce05333818df339387aeb777b0c70ec327d82#conventions
				return "\0test-fixture.ts";
			}
			return null;
		},

		load(id) {
			if (id === "\0test-fixture.ts") {
				return { code };
			}
			return null;
		},
	};
};

const compile = async (code: string) => {
	const bundle = await rolldown({
		experimental: {
			attachDebugInfo: "none",
		},
		input: "test-fixture",
		plugins: [
			testFixturePlugin(code),
			sportFunctions("production", "basketball"),
		],
	});

	const result = await bundle.generate({
		format: "es",
		minify: false,
		sourcemap: false,
	});

	// Should only be one output chunk
	let output;
	for (const chunk of result.output) {
		if (chunk.type === "chunk") {
			if (output !== undefined) {
				throw new Error("Multiple chunks");
			}
			output = chunk.code;
		}
	}
	if (output === undefined) {
		throw new Error("No output");
	}

	await bundle.close();

	const { code: formattedOutput } = await format("testFixture.js", output);
	return formattedOutput.trim();
};

const compare = async (input: string, output: string) => {
	const inputCompiled = await compile(input);

	assert.strictEqual(inputCompiled, output);
};

describe("bySport", () => {
	test("should replace bySport", () => {
		return compare(
			`const whatever = bySport({
  basketball: "basketball thing",
  football: "football thing",
  hockey: "hockey thing",
});
foo(whatever);`,
			`foo("basketball thing");`,
		);
	});

	test("should replace bySport, with quoted properties", () => {
		return compare(
			`const whatever = bySport({
  "basketball": "basketball thing",
  football: "football thing",
});
foo(whatever);`,
			`foo("basketball thing");`,
		);
	});

	test("should replace bySport, with default if no matching sport", () => {
		return compare(
			`const whatever = bySport({
  football: "football thing",
  default: "default thing",
});
foo(whatever);`,
			`foo("default thing");`,
		);
	});

	test("should replace bySport called as IIFE", () => {
		return compare(
			`const whatever = bySport({
  basketball: () => "basketball thing",
  football: () => "football thing",
})();
foo(whatever);`,
			`const whatever = (() => "basketball thing")();
foo(whatever);`,
		);
	});
});
