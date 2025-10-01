import { playwright as playwrightProvider } from "@vitest/browser/providers";
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
// eslint-disable-next-line import-x/no-unresolved
import { Local } from "browserstack-local";

export default class BrowserStackPlaywrightProvider
	extends playwrightProvider
	implements BrowserProvider
{
	name = "browserstack-playwright";
	testName = "";
	supportsParallelism = false;
	browser: Browser | undefined;
	bsLocal = new Local();

	getSupportedBrowsers = () =>
		Object.assign([], {
			includes: (value: string) => value.startsWith("browserstack:"),
		});

	async initialize(
		ctx: TestProject,
		options: BrowserProviderInitializationOptions,
	) {
		super.initialize(ctx, options);

		const { config, browser } = ctx;
		if (!browser) {
			throw new Error("BrowserStack provider requires a browser configuration");
		}

		const browserstackConfig = config.browserstack;

		this.testName = config.name;

		const { browser: browserType } = options;
		console.log("options", options);
		console.log(
			"config",
			browserstackConfig,
			"testName",
			this.testName,
			"browserType",
			browserType,
		);

		const bsLocalOptions = {
			force: true,
			forceLocal: true,
			user: process.env.BROWSERSTACK_USERNAME,
			key: process.env.BROWSERSTACK_ACCESS_KEY,
			...browserstackConfig.options,
			localIdentifier: `vitest-${Date.now()}`,
		};

		await new Promise<void>((resolve, reject) => {
			this.bsLocal.start(bsLocalOptions, (error) => {
				if (error) {
					reject(error);
				} else {
					console.log("BrowserStackLocal started");
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
		console.log("capabilities", capabilities);

		const wsEndpoint = `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(
			JSON.stringify(capabilities),
		)}`;

		let playwrightBrowser: BrowserType;
		if (capabilities.browser === "chrome") {
			playwrightBrowser = chromium;
		} else if (capabilities.browser === "playwright-webkit") {
			playwrightBrowser = webkit;
		} else if (capabilities.browser === "playwright-firefox") {
			playwrightBrowser = firefox;
		} else {
			throw new Error(
				`Unsupported browser type for BrowserStack Playwright: ${browserType}`,
			);
		}

		console.log("here", wsEndpoint);
		this.browser = await playwrightBrowser.connect(wsEndpoint);
		console.log("browser started");
	}

	openPage = async (sessionId: string, url: string) => {
		if (!this.browser) {
			throw new Error("Browser is not initialized.");
		}
		const page = await this.browser.newPage();
		await page.goto(url);
	};

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
