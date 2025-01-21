import * as path from "node:path";
//import babel from "vite-plugin-babel";
// eslint-disable-next-line import/no-unresolved
import { configDefaults, defineConfig } from "vitest/config";

const root = path.join(import.meta.dirname);

const sport = process.env.SPORT ?? "basketball";

// Would be nice to use the "workspace" feature but I couldn't get it to stop having process.env.SPORT bleed over into the wrong tests
const test =
	sport === "football"
		? {
				include: ["**/*.football/*.test.ts", "**/*.football.test.ts"],
			}
		: {
				exclude: [
					...configDefaults.exclude,
					"**/*.football/*.test.ts",
					"**/*.football.test.ts",
				],
				include: ["**/*.test.ts"],
			};

export default defineConfig({
	// This can be used with vite-plugin-babel for babel-plugin-sport-functions, but it's not necessary and it slows the tests down
	/*plugins: [
		babel({
			filter: /\.[cjt]sx?$/,
		}),
	],*/
	define: {
		"process.env.SPORT": JSON.stringify(sport),
	},
	resolve: {
		alias: {
			"league-schema": path.resolve(root, "build/files/league-schema.json"),
			"bbgm-polyfills": path.resolve(root, "src/common/polyfills-modern.ts"),
			"bbgm-polyfills-ui": path.resolve(root, "src/common/polyfills-noop.ts"),
			"bbgm-debug": path.resolve(root, "src/worker/core/debug/index.ts"),
		},
	},
	test: {
		...test,
		setupFiles: ["./src/test/setup.ts", "./src/worker/index.ts"],
	},
});
