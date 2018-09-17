/* eslint-env serviceworker */
/* global workbox:false */

importScripts(
    "https://storage.googleapis.com/workbox-cdn/releases/3.5.0/workbox-sw.js",
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
        new RegExp("^/manifest.webapp"),
        new RegExp("^/manifest_hack"),
        new RegExp("^/robots.txt"),
        new RegExp("^/sw.js"),
    ],
});

workbox.googleAnalytics.initialize();
