import { registerQuotaErrorCallback } from "workbox-core/registerQuotaErrorCallback.js";
import { clientsClaim } from "workbox-core";
import * as googleAnalytics from "workbox-google-analytics";
import { createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { CacheFirst } from "workbox-strategies";
import { NavigationRoute, registerRoute } from "workbox-routing";

// Why this rather than ExpirationPlugin with maxEntries? It's smaller code, but more importantly, ExpirationPlugin adds to cache before checking maxEntries. With maxEntries of 1 and several MB per resource, that could prematurely trigger a quota error.
class CacheOnlyOneItemPlugin {
	constructor(cacheName) {
		this._cacheName = cacheName;

		registerQuotaErrorCallback(() => this.deleteCache());
	}

	async cacheWillUpdate({ response }) {
		// Only cache successful response
		if (response.status === 200) {
			// Since we're only storing one item in the cache, just delete all old items
			const cache = await self.caches.open(this._cacheName);
			const keys = await cache.keys();
			for (const key of keys) {
				await cache.delete(key);
			}
			return response;
		}
		return null;
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
		new RegExp("^/robots.txt"),
		new RegExp("^/sw.js"),
		new RegExp("^/upgrade-"),
	],
});
registerRoute(navigationRoute);

self.addEventListener("message", event => {
	if (event.data === "getSWVersion") {
		event.ports[0].postMessage("REV_GOES_HERE");
	}

	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});

// Without this, can get into weird situations with the update checking logic in initServiceWorker, where a service worker has activated but is not yet contorlling the page, so we can't use the service worker to trigger refreshes
clientsClaim();

googleAnalytics.initialize();
