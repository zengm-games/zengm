import * as googleAnalytics from "workbox-google-analytics";
import {
	cleanupOutdatedCaches,
	createHandlerBoundToURL,
	precacheAndRoute,
} from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

// Will be filled in by tools/build-sw.js
precacheAndRoute(self.__WB_MANIFEST);

const handler = createHandlerBoundToURL("/index.html");
const navigationRoute = new NavigationRoute(handler, {
	denylist: [
		new RegExp("^/files"),
		new RegExp("^/fonts"),
		new RegExp("^/gen"),
		new RegExp("^/ico"),
		new RegExp("^/img"),
		new RegExp("^/manifest"),
		new RegExp("^/sw.js"),
	],
});
registerRoute(navigationRoute);

// https://developers.google.com/web/tools/workbox/guides/migrations/migrate-from-v3
cleanupOutdatedCaches();

googleAnalytics.initialize();

self.addEventListener("message", event => {
	if (event.data === "getSWVersion") {
		event.ports[0].postMessage("REV_GOES_HERE");
	}
});
