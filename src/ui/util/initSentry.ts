import * as Sentry from "@sentry/react";

// Must match applicationKey in tools/lib/rolldownConfig.ts
const APPLICATION_KEY = "zengm";

const client = Sentry.init({
	dsn: "https://1cd1f41219c84cb37f55b1095aefd621@o4507244863946752.ingest.us.sentry.io/4507244865978368",
	enabled:
		window.releaseStage === "beta" || window.releaseStage === "production",
	environment: window.releaseStage,
	release: window.bbgmVersion,
	initialScope: {
		tags: {
			// All sports share one Sentry project
			sport: __SPORT,
		},
	},
	beforeSend: (event) => {
		// Normalize league URLs to all look the same
		if (event.request?.url !== undefined) {
			event.request.url = event.request.url.replace(/\/l\/\d+/, "/l/0");
		}

		return event;
	},
	integrations: [
		// Ignore request breadcrumbs because it's almost all just header bidding noise
		Sentry.breadcrumbsIntegration({
			fetch: false,
			xhr: false,
		}),

		// Ignore errors from ads and other third party code. This uses metadata added to the UI bundle by sentryRollupPlugin. "exclusively" because third party code (like browser extensions wrapping built-in functions) can wind up in the stack trace of real errors.
		Sentry.thirdPartyErrorFilterIntegration({
			filterKeys: [APPLICATION_KEY],
			behaviour: "drop-error-if-exclusively-contains-third-party-frames",
			ignoreSentryInternalFrames: true,
		}),
	],
});

// Errors from the worker are reported here in the UI, but the metadata used by thirdPartyErrorFilterIntegration is only available for code running in this thread, so worker errors would look like third party errors. Sentry's webWorkerIntegration would handle that, except it doesn't support shared workers. So instead, identify worker code by URL.
const workerUrlPrefix = `${window.location.origin}/gen/worker`;
client?.on("applyFrameMetadata", (event) => {
	for (const exception of event.exception?.values ?? []) {
		for (const frame of exception.stacktrace?.frames ?? []) {
			if (frame.filename?.startsWith(workerUrlPrefix)) {
				frame.module_metadata ??= {
					[`_sentryBundlerPluginAppKey:${APPLICATION_KEY}`]: true,
				};
			}
		}
	}
});
