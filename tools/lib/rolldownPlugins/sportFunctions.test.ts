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

	test("should replace bySport, with as const", () => {
		return compare(
			`const whatever = bySport({
  basketball: ["a", "b"],
  football: ["c"],
} as const);
foo(whatever);`,
			`foo(["a", "b"]);`,
		);
	});

	test("should replace bySport, with satisfies", () => {
		return compare(
			`const whatever = bySport({
  basketball: ["a", "b"],
  football: ["c"],
} satisfies Record<string, string[]>);
foo(whatever);`,
			`foo(["a", "b"]);`,
		);
	});

	test("should replace bySport, with type argument", () => {
		return compare(
			`const whatever = bySport<string[]>({
  basketball: ["a", "b"],
  football: ["c"],
});
foo(whatever);`,
			`foo(["a", "b"]);`,
		);
	});
});

// Calls the transform directly, since formatting the output (like compare does) would normalize parens
const transform = (code: string) => {
	const plugin = sportFunctions("production", "basketball");
	const { handler } = plugin.transform as {
		handler: (code: string, id: string, meta: any) => { code: string };
	};
	return handler(code, "test.ts", {}).code;
};

describe("bySport parens", () => {
	test("should not wrap when not needed", () => {
		assert.strictEqual(
			transform(`const f = bySport({ basketball: (x) => x, default: 1 });`),
			`const f = (x) => x;`,
		);
		assert.strictEqual(
			transform(`foo(bySport({ basketball: a + b, default: 1 }), 2);`),
			`foo(a + b, 2);`,
		);
	});

	test("should wrap when needed", () => {
		assert.strictEqual(
			transform(`bySport({ basketball: (x) => x, default: 1 })();`),
			`((x) => x)();`,
		);
		assert.strictEqual(
			transform(`bySport({ basketball: a + b, default: 1 }) * 2;`),
			`(a + b) * 2;`,
		);
		assert.strictEqual(
			transform(`bySport({ basketball: a ? b : c, default: 1 }).foo;`),
			`(a ? b : c).foo;`,
		);
	});

	test("should handle nested bySport", () => {
		assert.strictEqual(
			transform(
				`const f = bySport({ basketball: bySport({ basketball: (x) => x, default: 1 }), default: 1 });`,
			),
			`const f = (x) => x;`,
		);
	});
});
