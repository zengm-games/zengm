requirejs.config({
    baseUrl: "/js",
    shim: {
        "lib/davis": {
            deps: ["lib/jquery"],
            exports: "Davis"
        },
        "lib/faces": {
            deps: ["lib/raphael"],
            exports: "faces"
        },
        "lib/IndexedDB-getAll-shim": {},
        "lib/jquery": {
            exports: "$"
        },
        "lib/raphael": {
            exports: "Raphael"
        },
        "lib/underscore": {
            exports: "_"
        }
    }
});

requirejs(["ui", "views", "lib/chai", "lib/jquery", "lib/IndexedDB-getAll-shim"], function (ui, views, chai, $) {
    "use strict";

    mocha.setup({
        ui: "bdd",
        globals: ["console"],
        timeout: 2000000000
    });
    chai.should();

    require(["test/core/contractNegotiation", "test/core/draft", "test/core/league", "test/core/player", "test/core/season", "test/core/trade"], function (testContractNegotiation, testDraft, testLeague, testPlayer, testSeason, testTrade) {
        mocha.run();
    });
});
