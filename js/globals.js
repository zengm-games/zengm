/**
 * @name globals
 * @namespace Defines the constant portions of g.
 */
define(["lib/knockout"], function (ko) {
    "use strict";

    // The way this works is... any "global" variables that need to be widely available are stored in g. Some of these are constants, like the ones defined below. Some others are dynamic, like the year of the current season, and are stored in the gameAttributes object store. The dynamic components of g are retrieved/updated/synced elsewhere. Yes, it's kind of confusing and arbitrary.

    var g;

    g = {};

    // If any of these things are supposed to change at any point, they should be stored in gameAttributes rather than here.
    g.numTeams = 30;  // [dollars]
    g.confs = [{cid: 0, name: "Eastern Conference"}, {cid: 1, name: "Western Conference"}];
    g.divs = [{did: 0, cid: 0, name: "Atlantic"}, {did: 1, cid: 0, name: "Central"}, {did: 2, cid: 0, name: "Southeast"}, {did: 3, cid: 1, name: "Southwest"}, {did: 4, cid: 1, name: "Northwest"}, {did: 5, cid: 1, name: "Pacific"}];
    g.salaryCap = 60000;  // [thousands of dollars]
    g.minPayroll = 40000;  // [thousands of dollars]
    g.luxuryPayroll = 65000;  // [thousands of dollars]
    g.luxuryTax = 0.5;
    g.minContract = 500;  // [thousands of dollars]
    g.maxContract = 20000;  // [thousands of dollars]
    g.minRosterSize = 10;

    // Constants in all caps
    g.PHASE = {
        PRESEASON: 0,
        REGULAR_SEASON: 1,
        AFTER_TRADE_DEADLINE: 2,
        PLAYOFFS: 3,
        BEFORE_DRAFT: 4,
        DRAFT: 5,
        AFTER_DRAFT: 6,
        RESIGN_PLAYERS: 7,
        FREE_AGENCY: 8
    };
    g.PLAYER = {
        FREE_AGENT: -1,
        UNDRAFTED: -2,
        RETIRED: -3
    };

/*    // Web workers - create only if we're not already inside a web worker!
    g.gameSimWorkers = [];
    if (typeof document !== "undefined") {
        for (i = 0; i < 1; i++) {
            g.gameSimWorkers[i] = new Worker("/js/core/gameSimWorker.js");
        }
    }*/

    g.vm = {
        leagueMenu: {
            lid: ko.observable()
        },
        playMenu: {
            options: ko.observable([]),
            phaseText: ko.observable(),
            statusText: ko.observable()
        }
    };

    g.enableLogging = window.enableLogging;

    // THIS MUST BE ACCURATE OR BAD STUFF WILL HAPPEN
    g.notInDb = ["dbm", "dbl", "lid", "numTeams", "confs", "divs", "salaryCap", "minPayroll", "luxuryPayroll", "luxuryTax", "minContract", "maxContract", "minRosterSize", "PHASE", "PLAYER", "gameSimWorkers", "vm", "enableLogging", "notInDb"];

    return g;
});