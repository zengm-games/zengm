/**
 * @name db
 * @namespace Creating, migrating, and connecting to databases; working with transactions.
 */
'use strict';

var Backboard = require('backboard/dist');
var g = require('./globals');
var Promise = require('bluebird');
var Davis = require('./lib/davis');
var eventLog = require('./util/eventLog');

var migrateMessage = '<h1>Upgrading...</h1><p>This might take a few minutes, depending on the size of your league.</p><p>If something goes wrong, <a href="http://webmasters.stackexchange.com/questions/8525/how-to-open-the-javascript-console-in-different-browsers" target="_blank">open the console</a> and see if there is an error message there. Then <a href="https://basketball-gm.com/contact/" target="_blank">let us know about your problem</a>. Please include as much info as possible.</p>';

Backboard.setPromiseConstructor(Promise);
Backboard.on('quotaexceeded', function () {
    eventLog.add(null, {
        type: "error",
        text: 'Your browser isn\'t letting Basketball GM store any more data!<br><br>Try <a href="/">deleting some old leagues</a> or deleting old data (Tools > Improve Performance within a league). Clearing space elsewhere on your hard drive might help too. <a href="https://basketball-gm.com/manual/debugging/quota-errors/"><b>Read this for more info.</b></a>',
        saveToDb: false,
        persistent: true
    });
});
Backboard.on('blocked', function () {
    window.alert("Please close all other tabs with this site open!");
});

/**
 * Create new meta database with the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
 */
function createMeta(upgradeDB) {
    console.log("Creating meta database");

    upgradeDB.createObjectStore("leagues", {keyPath: "lid", autoIncrement: true});
    upgradeDB.createObjectStore("achievements", {keyPath: "aid", autoIncrement: true});
}

/**
 * Migrate meta database to the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
 */
function migrateMeta(upgradeDB) {
    document.getElementById("content").innerHTML = migrateMessage;

    console.log("Upgrading meta database from version " + upgradeDB.oldVersion + " to version " + upgradeDB.version);

    if (upgradeDB.oldVersion <= 6) {
        (function () {
            upgradeDB.createObjectStore("achievements", {keyPath: "aid", autoIncrement: true});
        }());
    }
}

function connectMeta() {
    return Backboard.open('meta', 7, function (upgradeDB) {
        if (upgradeDB.oldVersion === 0) {
            createMeta(upgradeDB);
        } else {
            migrateMeta(upgradeDB);
        }
    }).then(function (db) {
        db.on('versionchange', function () { db.close(); });
        g.dbm = db;
    });
}

/**
 * Create a new league database with the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion 0.
 * @param {number} lid Integer league ID number for new league.
 */
function createLeague(upgradeDB, lid) {
    var draftPickStore, eventStore, gameStore, playerFeatStore, playerStatsStore, playerStore, releasedPlayerStore, teamSeasonsStore, teamStatsStore;

    console.log("Creating league" + lid + " database");

    // rid ("row id") is used as the keyPath for objects without an innate unique identifier
    playerStore = upgradeDB.createObjectStore("players", {keyPath: "pid", autoIncrement: true});
    playerStatsStore = upgradeDB.createObjectStore("playerStats", {keyPath: "psid", autoIncrement: true});
    upgradeDB.createObjectStore("teams", {keyPath: "tid"});
    teamSeasonsStore = upgradeDB.createObjectStore("teamSeasons", {keyPath: "rid", autoIncrement: true});
    teamStatsStore = upgradeDB.createObjectStore("teamStats", {keyPath: "rid", autoIncrement: true});
    gameStore = upgradeDB.createObjectStore("games", {keyPath: "gid"});
    upgradeDB.createObjectStore("schedule", {keyPath: "gid", autoIncrement: true});
    upgradeDB.createObjectStore("playoffSeries", {keyPath: "season"});
    releasedPlayerStore = upgradeDB.createObjectStore("releasedPlayers", {keyPath: "rid", autoIncrement: true});
    upgradeDB.createObjectStore("awards", {keyPath: "season"});
    upgradeDB.createObjectStore("trade", {keyPath: "rid"});
    upgradeDB.createObjectStore("draftOrder", {keyPath: "rid"});
    upgradeDB.createObjectStore("negotiations", {keyPath: "pid"});
    upgradeDB.createObjectStore("gameAttributes", {keyPath: "key"});
    upgradeDB.createObjectStore("messages", {keyPath: "mid", autoIncrement: true});
    draftPickStore = upgradeDB.createObjectStore("draftPicks", {keyPath: "dpid", autoIncrement: true});
    eventStore = upgradeDB.createObjectStore("events", {keyPath: "eid", autoIncrement: true});
    playerFeatStore = upgradeDB.createObjectStore("playerFeats", {keyPath: "fid", autoIncrement: true});

    playerStore.createIndex("tid", "tid", {unique: false});
    playerStore.createIndex("draft.year", "draft.year", {unique: false});
    playerStore.createIndex("retiredYear", "retiredYear", {unique: false});
    playerStore.createIndex("statsTids", "statsTids", {unique: false, multiEntry: true});
    playerStatsStore.createIndex("pid, season, tid", ["pid", "season", "tid"], {unique: false}); // Can't be unique because player could get traded back to same team in one season (and because playoffs is boolean)
//        gameStore.createIndex("tids", "tids", {unique: false, multiEntry: true}); // Not used because currently the season index is used. If multiple indexes are eventually supported, then use this too.
    teamSeasonsStore.createIndex("tid", "tid", {unique: false});
    teamSeasonsStore.createIndex("season, tid", ["season", "tid"], {unique: true});
    teamStatsStore.createIndex("tid", "tid", {unique: false});
    teamStatsStore.createIndex("season, tid", ["season", "tid"], {unique: false}); // Not unique because of playoffs
    gameStore.createIndex("season", "season", {unique: false});
    releasedPlayerStore.createIndex("tid", "tid", {unique: false});
    releasedPlayerStore.createIndex("contract.exp", "contract.exp", {unique: false});
    draftPickStore.createIndex("season", "season", {unique: false});
    draftPickStore.createIndex("tid", "tid", {unique: false});
    eventStore.createIndex("season", "season", {unique: false});
    eventStore.createIndex("pids", "pids", {unique: false, multiEntry: true});
    playerFeatStore.createIndex("pid", "pid", {unique: false});
    playerFeatStore.createIndex("tid", "tid", {unique: false});
//        eventStore.createIndex("tids", "tids", {unique: false, multiEntry: true}); // Not used currently, but might need to be added later
}

/**
 * Migrate a league database to the latest structure.
 *
 * @param {Object} event Event from onupgradeneeded, with oldVersion > 0.
 * @param {number} lid Integer league ID number.
 */
function migrateLeague(upgradeDB, lid) {
    document.getElementById("content").innerHTML = migrateMessage;

    console.log("Upgrading league" + lid + " database from version " + upgradeDB.oldVersion + " to version " + upgradeDB.version);

    if (upgradeDB.oldVersion <= 15) {
        throw new Error('League is too old to upgrade (version ' + upgradeDB.oldVersion + ')');
    }
}

function connectLeague(lid) {
    return Backboard.open('league' + lid, 16, function (upgradeDB) {
        if (upgradeDB.oldVersion === 0) {
            createLeague(upgradeDB, lid);
        } else {
            migrateLeague(upgradeDB, lid);
        }
    }).then(function (db) {
        db.on('versionchange', function () { db.close(); });
        g.dbl = db;
    });
}

function reset() {
    var debug, key;

    // localStorage, which is just use for table sorting currently
    debug = localStorage.debug; // Save debug setting and restore later
    for (key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            localStorage.removeItem(key);
        }
    }
    localStorage.debug = debug;

    // Delete any current league databases
    console.log("Deleting any current league databases...");
    g.dbm.leagues.getAll().then(function (leagues) {
        if (leagues.length === 0) {
            console.log('No leagues found.');
            Davis.location.assign(new Davis.Request("/"));
        }

        Promise.map(leagues, function (l) {
            return require('./core/league').remove(l.lid);
        }, {concurrency: Infinity}).then(function () {
            // Delete any current meta database
            console.log("Deleting any current meta database...");
            g.dbm.close();
            return Backboard.delete("meta");
        }).then(function () {
            location.reload();
        });
    });
}

module.exports = {
    connectMeta: connectMeta,
    connectLeague: connectLeague,
    reset: reset
};

