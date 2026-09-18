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
const hockeyTests = ["**/*.hockey/*.test.ts", "**/*.hockey.test.ts"];

const makeProject = (
	sport: Sport,
	environment: "node" | "browser",
	projectConfig: ProjectConfig,
): TestProjectInlineConfiguration => {
	return {
		define: {
			__NODE_ENV: JSON.stringify("test"),
			__SPORT: JSON.stringify(sport),
		},
		plugins: [
			{
				...sportFunctions("production", sport),

				configureVitest({ defineCacheKeyGenerator }) {
					defineCacheKeyGenerator(() => {
						return sport;
					});
				},

				// Need this or Vite runs TypeScript conversion before this plugin runs, resulting in moduleType in the plugin filter being js rather than ts/tsx
				enforce: "pre",
			},
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
		// Would like to fsModuleCache this, but it seems to not work properly even with defineCacheKeyGenerator in my plugin https://github.com/vitest-dev/vitest/issues/11281
		fsModuleCache: false,
		isolate: false,
		maxWorkers: 3,
		projects: [
			makeProject("basketball", "node", {
				name: "basketball",
				include: ["**/*.test.ts"],
				exclude: [
					...configDefaults.exclude,
					...footballTests,
					...baseballTests,
					...hockeyTests,
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
			makeProject("hockey", "node", {
				name: "hockey",
				include: hockeyTests,
			}),
			makeProject("basketball", "browser", {
				name: "browser",
				include: ["**/*.test.browser.ts"],
				benchmark: {
					include: ["**/*.bench.browser.?(c|m)[jt]s?(x)"],
				},
				browser: {
					enabled: true,
					headless: true,
					provider: playwright(),
					instances: [
						{ browser: "chromium" },
						// firefox and webkit have been flaky lately...
						// { browser: "firefox" },
						// { browser: "webkit" },
					],
					screenshotFailures: false,
				},
			}),
		],
	},
});
