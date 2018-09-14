importScripts(
    "https://storage.googleapis.com/workbox-cdn/releases/3.5.0/workbox-sw.js",
);

// Will be filled in by tools/build-sw.js
workbox.precaching.precacheAndRoute([]);

workbox.routing.registerNavigationRoute("/index.html");

/*
if viewing images/json/etc doesn't work, add this
, {
    blacklist: [
        new RegExp('/css'),
        new RegExp('/files'),
        new RegExp('/fonts'),
        new RegExp('/gen'),
        new RegExp('/ico'),
        new RegExp('/img'),
        new RegExp('/sw.js'),
    ]
}*/

workbox.googleAnalytics.initialize();
