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
const baseballTests = ["**/*.baseball/*.test.ts", "**/*.baseball.test.ts"];

const makeProject = (
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
			sportFunctions("production", sport),
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
			makeProject("basketball", "node", {
				name: "basketball",
				include: ["**/*.test.ts"],
				exclude: [
					...configDefaults.exclude,
					...footballTests,
					...baseballTests,
				],
			}),
			makeProject("football", "node", {
				name: "football",
				include: footballTests,
			}),
			makeProject("baseball", "node", {
				name: "baseball",
				include: baseballTests,
			}),
			makeProject("basketball", "browser", {
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
		],
	},
});
