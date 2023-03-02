module.exports = async config => {
	const karmaConfig = (await import("./tools/lib/karmaConfig.mjs")).default;

	config.set({
		...karmaConfig,
		browsers: ["ChromeHeadless", "FirefoxHeadless"],
	});
};
