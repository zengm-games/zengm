import karmaConfig from "./tools/lib/karmaConfig.ts";
import { readFileSync } from "node:fs";

const browserStack = JSON.parse(
	readFileSync("../../.browserstack.json", "utf8"),
);

const customLaunchers = [
	{
		base: "BrowserStack",
		browser: "firefox",
		browser_version: "115.0", // Works back to 115 currently
		os: "Windows",
		os_version: "10",
	},
	{
		base: "BrowserStack",
		browser: "chrome",
		browser_version: "85.0", // Works back to 85 currently (87 is the last on Mac 10.10)
		os: "Windows",
		os_version: "10",
	},
	{
		base: "BrowserStack",
		browser: "safari",
		browser_version: "15.6", // Works back to 15.4 currently
		os: "OS X",
		os_version: "Monterey",
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
