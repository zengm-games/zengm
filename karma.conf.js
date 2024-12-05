module.exports = async config => {
	const karmaConfig = (await import("./tools/lib/karmaConfig.ts")).default;

	config.set({
		...karmaConfig,
		browsers: ["ChromeHeadless", "FirefoxHeadless"],
	});
};
