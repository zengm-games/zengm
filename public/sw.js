/* eslint-env serviceworker */
/* global workbox:false */

importScripts(
    "https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js",
);

// Will be filled in by tools/build-sw.js
workbox.precaching.precacheAndRoute([]);

workbox.routing.registerNavigationRoute("/index.html", {
    blacklist: [
        new RegExp("^/bbgm.appcache"),
        new RegExp("^/files"),
        new RegExp("^/fonts"),
        new RegExp("^/gen"),
        new RegExp("^/ico"),
        new RegExp("^/img"),
        new RegExp("^/manifest"),
        new RegExp("^/sw.js"),
    ],
});

// https://developers.google.com/web/tools/workbox/guides/migrations/migrate-from-v3
workbox.precaching.cleanupOutdatedCaches();

// https://github.com/GoogleChrome/workbox/issues/1646#issuecomment-434393288
try {
    workbox.googleAnalytics.initialize();
} catch (e) {
    // fail silently
}
