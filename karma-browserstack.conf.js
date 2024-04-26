const browserStack = require("../../.browserstack.json"); // eslint-disable-line import/no-unresolved

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

module.exports = async config => {
	const karmaConfig = (await import("./tools/lib/karmaConfig.js")).default;

	config.set({
		...karmaConfig,
		browserStack,
		customLaunchers,
		browsers: Object.keys(customLaunchers),
	});
};
