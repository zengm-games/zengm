import {
	configDefaults,
	defineConfig,
	TestProjectInlineConfiguration,
} from "vitest/config";
import { pluginSportFunctions } from "./tools/lib/rolldownConfig.ts";
//import { playwright } from "@vitest/browser-playwright";
import { Sport } from "./tools/lib/getSport.ts";
import { ProjectConfig } from "vitest/node";

const footballTests = ["**/*.football/*.test.ts", "**/*.football.test.ts"];

export const getCommon = (
	sport: Sport,
	environment: "node" | "browser",
	projectConfig: ProjectConfig,
): TestProjectInlineConfiguration => {
	return {
		isolate: false,
		// Unsure why but the browser tests need `define` and the node tests need `test.env`
		define: {
			"process.env.NODE_ENV": JSON.stringify("test"),
			"process.env.SPORT": JSON.stringify(sport),
		},
		plugins: [
			// @ts-expect-error
			pluginSportFunctions("production", sport),
		],

		test: {
			...projectConfig,
			env: {
				SPORT: sport,
				NODE_ENV: "test",
			},
			setupFiles:
				environment === "node"
					? ["./src/test/setup.ts", "./src/worker/index.ts"]
					: ["./src/test/setup-e2e.ts"],
		},
	};
};

export default defineConfig({
	test: {
		projects: [
			{
				...getCommon("basketball", "node", {
					name: "basketball",
					include: ["**/*.test.ts"],
					exclude: [...configDefaults.exclude, ...footballTests],
				}),
			},
			{
				...getCommon("football", "node", {
					name: "football",
					include: footballTests,
				}),
			},
			// https://github.com/vitest-dev/vitest/issues/8887
			/*{
				...getCommon("basketball", "browser", {
					name: "browser",
					include: ["**QQQQQQQQQQQQQQQQQQQQ/*.test.browser.ts"],
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						instances: [
							{ browser: "chromium" },
							{ browser: "firefox" },
							{ browser: "webkit" },
						],
						screenshotFailures: false,
					},
				}),
			}*/
		],
	},
});
