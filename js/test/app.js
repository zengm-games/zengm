/*eslint no-unused-vars: 0*/
var should;

require.config({
    baseUrl: "/js",
    shim: {
        "lib/davis": {
            deps: ["lib/jquery"],
            exports: "Davis"
        },
        "lib/faces": {
            exports: "faces"
        },
        "lib/IndexedDB-getAll-shim": {},
        "lib/jquery": {
            exports: "$"
        },
        "lib/underscore": {
            exports: "_"
        }
    }
});

require(["lib/chai", "lib/IndexedDB-getAll-shim", "util/templateHelpers"], function (chai) {
    "use strict";

    mocha.setup({
        ui: "bdd",
        globals: ["console"],
        timeout: 2000000000
    });
    should = chai.should();

    require(["test/core/contractNegotiation", "test/core/draft", "test/core/finances", "test/core/league", "test/core/player", "test/core/season", "test/core/team", "test/core/trade", "test/util/account", "test/util/helpers", "test/views/components", "test/views/gameLog"], function () {
        mocha.run();
    });
});
