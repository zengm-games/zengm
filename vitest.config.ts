//import babel from "vite-plugin-babel";
import { configDefaults, defineConfig } from "vitest/config";

const footballTests = ["**/*.football/*.test.ts", "**/*.football.test.ts"];

export default defineConfig({
	// This can be used with vite-plugin-babel for babel-plugin-sport-functions, but it's not necessary and it slows the tests down
	/*plugins: [
		babel({
			filter: /\.[cjt]sx?$/,
		}),
	],*/
	define: {
		"process.env.NODE_ENV": JSON.stringify("test"),
		"process.env.SPORT": JSON.stringify("basketball"),
	},
	test: {
		isolate: false,
		setupFiles: ["./src/test/setup.ts", "./src/worker/index.ts"],
		projects: [
			{
				extends: true,
				test: {
					name: "basketball",
					env: {
						SPORT: "basketball",
					},
					include: ["**/*.test.ts"],
					exclude: [...configDefaults.exclude, ...footballTests],
					browser: {
						enabled: true,
						provider: "playwright",
						instances: [{ browser: "chromium" }],
					},
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
					browser: {
						enabled: true,
						provider: "playwright",
						instances: [{ browser: "chromium" }],
					},
				},
			},
		],
	},
});
