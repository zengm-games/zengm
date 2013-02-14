require.config({
    baseUrl: "/js"
});

requirejs(["lib/chai", "views"], function (chai, views) {
    "use strict";

    mocha.setup({
        ui: "bdd",
        globals: ["console"],
        timeout: 2000000000
    });
    chai.should();

    require(["test/core/contractNegotiation", "test/core/draft", "test/core/gameSimNew", "test/core/player", "test/core/season", "test/core/trade"], function (testContractNegotiation, testDraft, testGameSimNew, testPlayer, testSeason, testTrade) {
        mocha.run();
    });
});
