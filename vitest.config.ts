//import babel from "vite-plugin-babel";
// eslint-disable-next-line import/no-unresolved
import { configDefaults, defineConfig } from "vitest/config";
import { getRollupAliasEntries } from "./tools/lib/rollupConfig";

const footballTests = ["**/*.football/*.test.ts", "**/*.football.test.ts"];

export default defineConfig({
	// This can be used with vite-plugin-babel for babel-plugin-sport-functions, but it's not necessary and it slows the tests down
	/*plugins: [
		babel({
			filter: /\.[cjt]sx?$/,
		}),
	],*/
	resolve: {
		alias: getRollupAliasEntries("test"),
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
