var should;

requirejs.config({
    baseUrl: "/js",
    shim: {
        "../gen/templates": {
            deps: ["lib/handlebars.runtime", "util/templateHelpers"]
        },
        "lib/davis": {
            deps: ["lib/jquery"],
            exports: "Davis"
        },
        "lib/faces": {
            deps: ["lib/raphael"],
            exports: "faces"
        },
        "lib/handlebars.runtime": {
            exports: "Handlebars"
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

requirejs(["ui", "views", "lib/chai", "lib/jquery", "../gen/templates", "lib/IndexedDB-getAll-shim"], function (ui, views, chai, $) {
    "use strict";

    mocha.setup({
        ui: "bdd",
        globals: ["console"],
        timeout: 2000000000
    });
    should = chai.should();

    require(["test/core/contractNegotiation", "test/core/draft", "test/core/finances", "test/core/league", "test/core/player", "test/core/season", "test/core/trade", "test/util/helpers", "test/views/gameLog"], function () {
        mocha.run();
    });
});
