const karmaConfig = require("./tools/lib/karmaConfig");
const browserStack = require("../../.browserstack.json"); // eslint-disable-line import/no-unresolved

const customLaunchers = [
	{
		base: "BrowserStack",
		browser: "firefox",
		browser_version: "61.0", // Works back to 47 currently (52 is an LTS and the last release on XP)
		os: "Windows",
		os_version: "10",
	},
	{
		base: "BrowserStack",
		browser: "chrome",
		browser_version: "68.0", // Works back to 49 currently (last release on XP and some old Mac versions)
		os: "Windows",
		os_version: "10",
	},
	{
		base: "BrowserStack",
		browser: "safari",
		browser_version: "11.1", // Works back to 10 currently (except fetch)
		os: "OS X",
		os_version: "High Sierra",
	},
].reduce((acc, browser, i) => {
	acc[i] = browser;
	return acc;
}, {});

module.exports = function (config) {
	config.set({
		...karmaConfig,
		browserStack,
		customLaunchers,
		browsers: Object.keys(customLaunchers),
	});
};
