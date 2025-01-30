import karmaConfig from "./tools/lib/karmaConfig.ts";

export default (config) => {
	config.set({
		...karmaConfig,
		browsers: ["ChromeHeadless", "FirefoxHeadless"],
	});
};
