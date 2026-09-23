import { rolldown, type RolldownPlugin } from "rolldown";
import { exactRegex } from "rolldown/filter";
import { format } from "oxfmt";
import { assert, describe, test } from "vitest";
import { sportFunctions } from "./sportFunctions.ts";

// https://vite.dev/guide/api-plugin#importing-a-virtual-file
const testFixturePlugin = (code: string): RolldownPlugin => {
	const virtualModuleId = "virtual:test-fixture";
	const resolvedVirtualModuleId = `\0${virtualModuleId}.ts`;

	return {
		name: "test-fixture-plugin",
		resolveId: {
			filter: { id: exactRegex(virtualModuleId) },
			handler() {
				return resolvedVirtualModuleId;
			},
		},
		load: {
			filter: { id: exactRegex(resolvedVirtualModuleId) },
			handler() {
				return code;
			},
		},
	};
};

const compile = async (code: string) => {
	const bundle = await rolldown({
		experimental: {
			attachDebugInfo: "none",
		},
		input: "virtual:test-fixture",
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

describe("isSport", () => {
	test("should replace isSport in if", () => {
		return compare(
			`if (isSport("basketball")) {
  console.log("foo");
}`,
			`console.log("foo");`,
		);
	});

	test("should replace isSport in if, for other sport", () => {
		return compare(
			`if (isSport("football")) {
  console.log("foo");
}`,
			``,
		);
	});

	test("should replace !isSport in if", () => {
		return compare(
			`if (!isSport("basketball")) {
  console.log("foo");
}`,
			``,
		);
	});

	test("should replace isSport in ternary", () => {
		return compare(`foo(isSport("basketball") ? 1 : 0);`, `foo(1);`);
	});
});

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
