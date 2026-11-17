import Bugsnag from "@bugsnag/browser";
import BugsnagPluginReact from "@bugsnag/plugin-react";

Bugsnag.start({
	apiKey: "b1ae6247b6a999159883b98af8e39fe6",
	appType: __SPORT,
	appVersion: window.bbgmVersion,
	autoTrackSessions: false,
	onError: (event) => {
		// The InMobi consent manager's GPP message handler (src/ui/util/adScripts/consentManager.ts) calls event.source.postMessage without checking that event.source still exists, which fails when the sender has gone away. It's vendor code and harmless.
		if (
			event.errors.some(
				(error) =>
					error.errorMessage.includes("event.source.postMessage") &&
					error.stacktrace.some((row) =>
						row.file?.startsWith("https://cmp.inmobi.com/"),
					),
			)
		) {
			return false;
		}

		// Normalize league URLs to all look the same
		if (event && typeof event.context === "string") {
			event.context = event.context.replace(/^\/l\/\d+/, "/l/0");

			// All the errors in my application code include "/gen/" in the filename of some source code file in the stack trace. Stack traces fully on another domain are already filtered out automatically, but this still helps with some. But not all, since some will have part of the stack trace in my code (especially since Bugsnag is in my code, sometimes that gets in the stack trace).
			const isInApplicationCode = event.errors.some((error) => {
				// row.file is undefined in googlebot and maybe elsewhere
				return error.stacktrace.some((row) => row.file?.includes("/gen/"));
			});
			if (!isInApplicationCode) {
				return false;
			}
		}
	},

	// Ignore request breadcrumbs because it's almost all just header bidding noise
	enabledBreadcrumbTypes: [
		"error",
		"log",
		"manual",
		"navigation",
		"process",
		"state",
		"user",
	],
	enabledReleaseStages: ["beta", "production"],
	plugins: [new BugsnagPluginReact()],
	releaseStage: window.releaseStage,
});
