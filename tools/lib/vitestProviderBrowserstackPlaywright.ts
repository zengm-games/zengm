import { playwright } from "@vitest/browser/providers";
import type {
	BrowserProvider,
	BrowserProviderInitializationOptions,
	TestProject,
} from "vitest/node";
import {
	chromium,
	firefox,
	webkit,
	type Browser,
	type BrowserType,
} from "playwright";
import { Local, type Options } from "browserstack-local";

// https://www.browserstack.com/docs/automate/playwright/playwright-capabilities?fw-lang=nodejs
// https://www.browserstack.com/list-of-browsers-and-platforms/playwright
declare module "vitest/node" {
	interface InlineConfig {
		browserstack?: {
			options: Partial<Options>;
			capabilities: Record<
				string,
				| {
						os: string;
						os_version: string;
						browser: string;
						browser_version: string;
						"browserstack.geolocation"?: string;
						project?: string;
						build?: string;
						name?: string;
						buildTag?: string;
						resolution?: string;
						"browserstack.playwrightVersion"?: string;
						"client.playwrightVersion"?: string;
						"browserstack.maskCommands"?: string;
						"browserstack.debug"?: "true" | "false";
						"browserstack.video"?: "true" | "false";
						"browserstack.console"?:
							| "disable"
							| "errors"
							| "warnings"
							| "info"
							| "verbose";
						"browserstack.networkLogs"?: "true" | "false";
						"browserstack.networkLogsOptions"?: "true" | "false";
						"browserstack.interactiveDebugging"?: "true" | "false";
				  }
				| undefined
			>;
		};
	}
}

export default class BrowserStackPlaywrightProvider
	extends playwright
	implements BrowserProvider
{
	override name = "browserstack-playwright";
	override supportsParallelism = true;

	private browser: Browser | undefined;
	private bsLocal = new Local();

	override getSupportedBrowsers = () => {
		// Copied from @chialab/vitest-provider-browserstack - let user define whatever they want (maybe the same browser with different configurations), not just a predefined list of indivual browsers
		return Object.assign([], {
			includes: (value: string) => {
				return value.startsWith("browserstack:");
			},
		});
	};

	override async initialize(
		ctx: TestProject,
		options: BrowserProviderInitializationOptions,
	) {
		super.initialize(ctx, options);

		const { config, browser } = ctx;
		if (!browser) {
			throw new Error("BrowserStack provider requires a browser configuration");
		}
		const browserstackConfig = config.browserstack;
		const { browser: browserType } = options;

		const bsLocalOptions = {
			force: true,
			forceLocal: true,
			user: process.env.BROWSERSTACK_USERNAME,
			key: process.env.BROWSERSTACK_ACCESS_KEY,
			localIdentifier: `vitest-${Date.now()}`,
			...browserstackConfig.options,
		};

		await new Promise<void>((resolve, reject) => {
			this.bsLocal.start(bsLocalOptions, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});

		const capabilitiesBrowserType = browserType.replace("browserstack:", "");
		const configCapabilities =
			browserstackConfig.capabilities[capabilitiesBrowserType];
		if (!configCapabilities) {
			throw new Error(
				`No capabilities settings found for "${capabilitiesBrowserType}`,
			);
		}

		// https://www.browserstack.com/docs/automate/playwright/playwright-capabilities
		const capabilities = {
			"browserstack.username": bsLocalOptions.user,
			"browserstack.accessKey": bsLocalOptions.key,
			"browserstack.local": true,
			"browserstack.localIdentifier": bsLocalOptions.localIdentifier,
			...configCapabilities,
		};

		const wsEndpoint = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(
			JSON.stringify(capabilities),
		)}`;

		let playwrightBrowser: BrowserType;
		if (capabilities.browser === "chrome") {
			playwrightBrowser = chromium;
		} else if (
			capabilities.browser === "playwright-webkit" ||
			capabilities.browser === "iphone"
		) {
			playwrightBrowser = webkit;
		} else if (capabilities.browser === "playwright-firefox") {
			playwrightBrowser = firefox;
		} else {
			throw new Error(
				`Unsupported browser type for BrowserStack Playwright: ${browserType}`,
			);
		}

		this.browser = await playwrightBrowser.connect(wsEndpoint);
	}

	override openPage = async (sessionId: string, url: string) => {
		if (!this.browser) {
			throw new Error("Browser is not initialized");
		}
		const page = await this.browser.newPage();
		await page.goto(url);
	};

	// idk why but this makes it work, rather than overriding close
	async closeBrowser() {
		await Promise.all([
			this.browser?.close(),
			new Promise<void>((resolve) => {
				this.bsLocal.stop(() => {
					resolve();
				});
			}),
		]);

		await super.close();
	}
}
