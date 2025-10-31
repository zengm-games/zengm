import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { getCommon } from "./vitest.config.ts";

const sport = "basketball";

export default defineConfig({
	...getCommon("basketball", "browser", {
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
});
