import Bugsnag from "@bugsnag/browser";
import BugsnagPluginReact from "@bugsnag/plugin-react";

Bugsnag.start({
	apiKey: window.bugsnagKey,
	appVersion: window.bbgmVersion,
	autoTrackSessions: false,
	onError: function (event) {
		// Normalize league URLs to all look the same
		if (event && typeof event.context === "string") {
			event.context = event.context.replace(/^\/l\/[0-9]+/, "/l/0");
		}
	},
	enabledReleaseStages: ["beta", "production"],
	plugins: [new BugsnagPluginReact()],
	releaseStage: window.releaseStage,
});

import * as Sentry from "@sentry/react";

Sentry.init({
	dsn: "https://1cd1f41219c84cb37f55b1095aefd621@o4507244863946752.ingest.us.sentry.io/4507244865978368",
	integrations: [],
	environment: window.releaseStage,
	release: window.bbgmVersion,
	allowUrls: [location.origin],
	enabled:
		window.releaseStage === "beta" || window.releaseStage === "production",
	autoSessionTracking: false,
	beforeSend: event => {
		// Normalize league URLs to all look the same
		if (event.request?.url !== undefined) {
			event.request.url = event.request.url.replace(/\/l\/[0-9]+/, "/l/0");
		}
		return event;
	},
});
// eslint-disable-next-line import/namespace
Sentry.setTag("sport", process.env.SPORT);
