requirejs.config({
    baseUrl: "/js",
    shim: {
        "lib/faces": {
            deps: ["lib/raphael"],
            exports: "faces"
        },
        "lib/raphael": {
            exports: "Raphael"
        },
        "lib/underscore": {
            exports: "_"
        }
    }
});

requirejs(["lib/chai", "views"], function (chai, views) {
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
