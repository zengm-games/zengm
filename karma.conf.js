const karmaConfig = require("./tools/lib/karmaConfig");

module.exports = function (config) {
	config.set({
		...karmaConfig,
		browsers: ["ChromeHeadless", "FirefoxHeadless"],
	});
};
