requirejs.config({
    baseUrl: "/js",
    shim: {
        "lib/faces": {
            deps: ["lib/raphael"],
            exports: "faces"
        },
        "lib/IndexedDB-getAll-shim": {},
        "lib/raphael": {
            exports: "Raphael"
        },
        "lib/underscore": {
            exports: "_"
        }
    }
});

// lib/IndexedDB-getAll-shim doesn't export anything, so it's at the end
requirejs(["lib/chai", "views", "lib/IndexedDB-getAll-shim"], function (chai, views) {
    "use strict";

    mocha.setup({
        ui: "bdd",
        globals: ["console"],
        timeout: 2000000000
    });
    chai.should();

    require(["test/core/contractNegotiation", "test/core/draft", "test/core/player", "test/core/season", "test/core/trade"], function (testContractNegotiation, testDraft, testPlayer, testSeason, testTrade) {
        mocha.run();
    });
});
