module.exports = async config => {
	const karmaConfig = (await import("./tools/lib/karmaConfig.js")).default;

	config.set({
		...karmaConfig,
		browsers: ["ChromeHeadless", "FirefoxHeadless"],
	});
};
