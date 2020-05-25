import * as googleAnalytics from "workbox-google-analytics";
import { ExpirationPlugin } from "workbox-expiration";
import {
	cleanupOutdatedCaches,
	createHandlerBoundToURL,
	precacheAndRoute,
} from "workbox-precaching";
import { CacheFirst } from "workbox-strategies";
import { NavigationRoute, registerRoute } from "workbox-routing";

registerRoute(
	new RegExp("/gen/real-player-data.*"),
	new CacheFirst({
		cacheName: "real-player-data",
		plugins: [
			new ExpirationPlugin({
				maxEntries: 1,
				purgeOnQuotaError: true,
			}),
		],
	}),
);

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
