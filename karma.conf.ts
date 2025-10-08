import karmaConfig from "./tools/lib/karmaConfig.ts";

export default (config: any) => {
	config.set({
		...karmaConfig,
		browsers: ["ChromeHeadless", "FirefoxHeadless"],
	});
};
