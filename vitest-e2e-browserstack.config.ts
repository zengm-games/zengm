import { defineConfig } from "vitest/config";
import { pluginSportFunctions } from "./tools/lib/rolldownConfig.ts";
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync("../../.browserstack.json", "utf8"));

const sport = "basketball";

export default defineConfig({
	plugins: [
		// @ts-expect-error
		pluginSportFunctions("production", sport),
	],
	define: {
		"process.env.NODE_ENV": JSON.stringify("test"),
		"process.env.SPORT": JSON.stringify(sport),
	},
	test: {
		isolate: false,
		setupFiles: ["./src/test/setup-e2e.ts"],
		env: {
			SPORT: sport,
		},
		include: ["**/*.test.browser.ts"],
		browser: {
			enabled: true,
			headless: true,
			provider: "./tools/lib/vitestProviderBrowserstackPlaywright.ts",
			instances: [
				{ browser: "browserstack:chrome" },
				{ browser: "browserstack:firefox" },

				// Not sure why this doesn't work
				// { browser: "browserstack:webkit" },
			],
		},
		browserstack: {
			options: {
				user: config.username,
				key: config.accessKey,
			},
			capabilities: {
				chrome: {
					browser: "chrome",
					browser_version: "85.0",
					os: "windows",
					os_version: "10",
				},
				firefox: {
					browser: "playwright-firefox",
					browser_version: "115.0",
					os: "windows",
					os_version: "10",
				},
				webkit: {
					browser: "playwright-webkit",
					browser_version: "15.4",
					os: "osx",
					os_version: "monterey",
				},
			},
		},
	},
});
