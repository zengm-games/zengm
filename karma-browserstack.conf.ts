import karmaConfig from "./tools/lib/karmaConfig.ts";
import { readFileSync } from "node:fs";

const browserStack = JSON.parse(
	readFileSync("../../.browserstack.json", "utf8"),
);

const customLaunchers = [
	{
		base: "BrowserStack",
		browser: "firefox",
		browser_version: "78.0", // Works back to 78 currently (last release on some old Mac versions)
		os: "Windows",
		os_version: "10",
	},
	{
		base: "BrowserStack",
		browser: "chrome",
		browser_version: "80.0", // Works back to 75 currently
		os: "Windows",
		os_version: "10",
	},
	{
		base: "BrowserStack",
		browser: "safari",
		browser_version: "14.1", // Works back to 12.1 currently
		os: "OS X",
		os_version: "Big Sur",
	},
].reduce((acc, browser, i) => {
	acc[i] = browser;
	return acc;
}, {});

export default (config) => {
	config.set({
		...karmaConfig,
		browserStack,
		customLaunchers,
		browsers: Object.keys(customLaunchers),
	});
};
