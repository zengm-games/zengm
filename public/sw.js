import { registerQuotaErrorCallback } from "workbox-core/registerQuotaErrorCallback.js";
import * as googleAnalytics from "workbox-google-analytics";
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { CacheFirst } from "workbox-strategies";
import { NavigationRoute, registerRoute } from "workbox-routing";

class CacheOnlyOneItemPlugin {
	constructor(cacheName) {
		this._cacheName = cacheName;

		registerQuotaErrorCallback(() => this.deleteCache());
	}

	async cacheWillUpdate({ response }) {
		// Since we're only storing one item in the cache, just delete all old items
		const cache = await self.caches.open(this._cacheName);
		const keys = await cache.keys();
		for (const key of keys) {
			await cache.delete(key);
		}
		return response;
	}

	async deleteCache() {
		await self.caches.delete(this._cacheName);
	}
}

registerRoute(
	new RegExp("/gen/real-player-data-*"),
	new CacheFirst({
		cacheName: "real-player-data",
		plugins: [new CacheOnlyOneItemPlugin("real-player-data")],
	}),
);

registerRoute(
	new RegExp("/gen/real-player-stats-*"),
	new CacheFirst({
		cacheName: "real-player-stats",
		plugins: [new CacheOnlyOneItemPlugin("real-player-stats")],
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

googleAnalytics.initialize();

self.addEventListener("message", event => {
	if (event.data === "getSWVersion") {
		event.ports[0].postMessage("REV_GOES_HERE");
	}
});
