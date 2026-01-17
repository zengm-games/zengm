import {
	configDefaults,
	defineConfig,
	type TestProjectInlineConfiguration,
} from "vitest/config";
import type { Sport } from "./tools/lib/getSport.ts";
import type { ProjectConfig } from "vitest/node";
import { playwright } from "@vitest/browser-playwright";
import { sportFunctions } from "./tools/lib/rolldownPlugins/sportFunctions.ts";

const footballTests = ["**/*.football/*.test.ts", "**/*.football.test.ts"];

export const getCommon = (
	sport: Sport,
	environment: "node" | "browser",
	projectConfig: ProjectConfig,
): TestProjectInlineConfiguration => {
	return {
		define: {
			"process.env.NODE_ENV": JSON.stringify("test"),
			"process.env.SPORT": JSON.stringify(sport),
		},
		plugins: [
			// @ts-expect-error
			sportFunctions("test", sport),
		],

		test: {
			...projectConfig,
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
			{
				...getCommon("basketball", "browser", {
					name: "browser",
					include: ["**/*.test.browser.ts"],
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
			},
		],
	},
});
