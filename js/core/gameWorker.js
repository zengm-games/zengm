importScripts("../lib/require.js");

require.config({
    baseUrl: "../",
    shim: {
        "lib/underscore": {
            exports: "_"
        }
    }
});

require(["core/gameSim"], function (gameSim) {
    "use strict";

    self.addEventListener("message", function (e) {
        var gs;

        gs = new gameSim.GameSim(e.data.gid, e.data.homeTeam, e.data.awayTeam);
        self.postMessage(gs.run());
    }, false);

    self.postMessage("Ready!");
});