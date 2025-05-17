import Bugsnag from "@bugsnag/browser";
import BugsnagPluginReact from "@bugsnag/plugin-react";

Bugsnag.start({
	apiKey: window.bugsnagKey,
	appVersion: window.bbgmVersion,
	autoTrackSessions: false,
	onError: (event) => {
		// Normalize league URLs to all look the same
		if (event && typeof event.context === "string") {
			event.context = event.context.replace(/^\/l\/\d+/, "/l/0");

			// All the errors in my application code include "/gen/" in the filename of some source code file in the stack trace. So hopefully this will filter out all the errors from ads.
			const isInApplicationCode = event.errors.some((error) =>
				error.stacktrace.some((row) => row.file.includes("/gen/")),
			);
			if (!isInApplicationCode) {
				return false;
			}
		}
	},
	enabledReleaseStages: ["beta", "production"],
	plugins: [new BugsnagPluginReact()],
	releaseStage: window.releaseStage,
});
