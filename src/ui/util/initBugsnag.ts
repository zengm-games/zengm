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
		}
	},
	enabledReleaseStages: ["beta", "production"],
	plugins: [new BugsnagPluginReact()],
	releaseStage: window.releaseStage,
});
