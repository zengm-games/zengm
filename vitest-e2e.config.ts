import { defineConfig } from "vitest/config";
import { pluginSportFunctions } from "./tools/lib/rolldownConfig.ts";

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
			provider: "playwright",
			instances: [
				{ browser: "chromium" },
				{ browser: "firefox" },
				{ browser: "webkit" },
			],
		},
	},
});
