const karmaConfig = require("./tools/lib/karmaConfig");
const browserStack = require("../../.browserstack.json"); // eslint-disable-line import/no-unresolved

const customLaunchers = [
	{
		base: "BrowserStack",
		browser: "firefox",
		browser_version: "78.0", // Works back to 78 currently (last release on some old Mac versions) - it did work back to 47 before then, but bit rot eventually got too much and I couldn't figure it out.
		os: "Windows",
		os_version: "10",
	},
	{
		base: "BrowserStack",
		browser: "chrome",
		browser_version: "80.0", // Works back to 49 currently (last release on XP and some old Mac versions). Importing league files only works back to 54
		os: "Windows",
		os_version: "10",
	},
	{
		base: "BrowserStack",
		browser: "safari",
		browser_version: "13.1", // Works back to 11 currently, although league creation only works in 12. Some people are still playing existing leagues in 11 though.
		os: "OS X",
		os_version: "Catalina",
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
