import { defineConfig } from "vitest/config";
import { pluginSportFunctions } from "./tools/lib/rolldownConfig.ts";
import { readFileSync } from "node:fs";
// eslint-disable-next-line import-x/no-unresolved
import { type Options } from "browserstack-local";

declare module "vitest/node" {
	interface InlineConfig {
		browserstack?: {
			options: Partial<Options>;
			capabilities: Record<
				string,
				| {
						os: "Windows" | "OS X";
						os_version: string;
						browser:
							| "chrome"
							| "edge"
							| "playwright-chromium"
							| "playwright-webkit"
							| "playwright-firefox";
						browser_version: string;
						"browserstack.geolocation"?: string;
						project?: string;
						build?: string;
						name?: string;
						buildTag?: string;
						resolution?: string;
						"browserstack.playwrightVersion"?: string;
						"client.playwrightVersion"?: string;
						"browserstack.maskCommands"?: string;
						"browserstack.debug"?: "true" | "false";
						"browserstack.video"?: "true" | "false";
						"browserstack.console"?:
							| "disable"
							| "errors"
							| "warnings"
							| "info"
							| "verbose";
						"browserstack.networkLogs"?: "true" | "false";
						"browserstack.networkLogsOptions"?: "true" | "false";
						"browserstack.interactiveDebugging"?: "true" | "false";
				  }
				| undefined
			>;
		};
	}
}

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
			provider: "./vitest-provider-browserstack-playwright.ts",
			instances: [
				{ browser: "browserstack:chrome" },
				//{ browser: "browserstack:firefox" },
				//{ browser: "browserstack:safari" },
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
					os: "Windows",
					os_version: "10",
				},
				firefox: {
					browser: "playwright-firefox",
					browser_version: "115.0",
					os: "Windows",
					os_version: "10",
				},
				safari: {
					browser: "playwright-webkit",
					browser_version: "15.6",
					os: "OS X",
					os_version: "monterey",
				},
			},
		},
	},
});
