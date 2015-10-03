/*global importScripts, self */

'use strict';

var gameSim = require('./gameSim');

importScripts("lib/require.js");

require.config({
    baseUrl: "../",
    shim: {
        "underscore": {
            exports: "_"
        }
    }
});

self.addEventListener("message", function (e) {
    var gs, i, results;

    results = [];
    for (i = 0; i < e.data.length; i++) {
        gs = new gameSim.GameSim(e.data[i].gid, e.data[i].homeTeam, e.data[i].awayTeam);
        results.push(gs.run());
    }

    self.postMessage(results);
}, false);
