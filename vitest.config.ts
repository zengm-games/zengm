import * as path from "node:path";
//import babel from "vite-plugin-babel";
// eslint-disable-next-line import/no-unresolved
import { configDefaults, defineConfig } from "vitest/config";

const root = path.join(import.meta.dirname);

const footballTests = ["**/*.football/*.test.ts", "**/*.football.test.ts"];

export default defineConfig({
	// This can be used with vite-plugin-babel for babel-plugin-sport-functions, but it's not necessary and it slows the tests down
	/*plugins: [
		babel({
			filter: /\.[cjt]sx?$/,
		}),
	],*/
	resolve: {
		alias: {
			"league-schema": path.resolve(root, "build/files/league-schema.json"),
			"bbgm-polyfills": path.resolve(root, "src/common/polyfills-modern.ts"),
			"bbgm-polyfills-ui": path.resolve(root, "src/common/polyfills-noop.ts"),
			"bbgm-debug": path.resolve(root, "src/worker/core/debug/index.ts"),
		},
	},
	test: {
		isolate: false,
		setupFiles: ["./src/test/setup.ts", "./src/worker/index.ts"],
		workspace: [
			{
				extends: true,
				test: {
					name: "basketball",
					env: {
						SPORT: "basketball",
					},
					include: ["**/*.test.ts"],
					exclude: [...configDefaults.exclude, ...footballTests],
				},
			},
			{
				extends: true,
				test: {
					name: "football",
					env: {
						SPORT: "football",
					},
					include: footballTests,
				},
			},
		],
	},
});
