define(["util/helpers"], function (helpers) {
    "use strict";

    function connect_meta() {
        var request;

        console.log('Connecting to database "meta"');
        request = g.indexedDB.open("meta", 1);
        request.onerror = function (event) {
            console.log("Connection error");
        };
        request.onblocked = function () { g.dbm.close(); };
        request.onupgradeneeded = function (event) {
            var i, leagueStore, teams, teamStore;
            console.log("Upgrading meta database");

            g.dbm = event.target.result;

            leagueStore = g.dbm.createObjectStore("leagues", {keyPath: "lid", autoIncrement: true});
            teamStore = g.dbm.createObjectStore("teams", {keyPath: "tid"});
            teamStore.createIndex("cid", "cid", {unique: false});
            teamStore.createIndex("did", "did", {unique: false});

            teams = helpers.getTeams();
            for (i = 0; i < teams.length; i++) {
                teamStore.add(teams[i]);
            }
        };
        return request;
    }

    function connect_league(lid) {
        var request;

        console.log('Connecting to database "league' + lid + '"');
        request = g.indexedDB.open("league" + lid, 1);
        request.onerror = function (event) {
            console.log("Connection error");
        };
        request.onblocked = function () { g.dbl.close(); };
        request.onupgradeneeded = function (event) {
            var gameStore, playerStore, playoffSeriesStore, scheduleStore, teamStore;

            console.log("Upgrading league" + lid + " database");

            g.dbl = event.target.result;

            // rid ("row id") is used as the keyPath for objects without an innate unique identifier
            playerStore = g.dbl.createObjectStore("players", {keyPath: "pid", autoIncrement: true});
            teamStore = g.dbl.createObjectStore("teams", {keyPath: "rid", autoIncrement: true});
            gameStore = g.dbl.createObjectStore("games", {keyPath: "gid"});
            scheduleStore = g.dbl.createObjectStore("schedule", {keyPath: "gid", autoIncrement: true});
            playoffSeriesStore = g.dbl.createObjectStore("playoffSeries", {keyPath: "season"});
            // ... other stores go here later

            playerStore.createIndex("tid", "tid", {unique: false});
            playerStore.createIndex("draftYear", "draftYear", {unique: false});
            playerStore.createIndex("ratings.season", "ratings.season", {unique: false});
            playerStore.createIndex("statsTids", "statsTids", {unique: false, multiEntry: true});
//                playerStore.createIndex("stats.season", "stats.season", {unique: false, multiEntry: true});
//                playerStore.createIndex("stats.playoffs", "stats.playoffs", {unique: false, multiEntry: true});
            teamStore.createIndex("tid", "tid", {unique: false});
            teamStore.createIndex("cid", "cid", {unique: false});
            teamStore.createIndex("did", "did", {unique: false});
            teamStore.createIndex("season", "season", {unique: false});
//                teamStore.createIndex("stats.playoffs", "stats.playoffs", {unique: false});
//                gameStore.createIndex("tid", "tid", {unique: false}); // Not used because it's useless without oppTid checking too
            gameStore.createIndex("season", "season", {unique: false});
        };
        return request;
    }

    /**
     * Add a new player to the database or update an existing player.
     */
    function putPlayer(ot, p) {
        var playerStore;

        if (ot instanceof IDBObjectStore) {
            playerStore = ot;
        } else if (ot instanceof IDBTransaction) {
            playerStore = ot.objectStore("players");
        } else {
            playerStore = g.dbl.transaction("players", IDBTransaction.READ_WRITE).objectStore("players");
        }

        playerStore.put(p);
    }

    function getTeam(tid, season, cb) {

    }

    function getTeams(ot, season, sortBy, cb) {
        var teamStore;

        if (ot instanceof IDBObjectStore) {
            teamStore = ot;
        } else if (ot instanceof IDBTransaction) {
            teamStore = ot.objectStore("teams");
        } else {
            teamStore = g.dbl.transaction("teams").objectStore("teams");
        }

        teamStore.index("season").getAll(season).onsuccess = function (event) {
            var teamsAll;

            teamsAll = event.target.result;

            if (sortBy === "winp") {
                // Sort by winning percentage, descending
                teamsAll.sort(function (a, b) {  return (b.won / (b.won + b.lost)) - (a.won / (a.won + a.lost)); });
            } else if (sortBy === "winpAsc") {
                // Sort by winning percentage, ascending
                teamsAll.sort(function (a, b) {  return (a.won / (a.won + a.lost)) - (b.won / (b.won + b.lost)); });
            }

            cb(teamsAll);
        };
    }

    return {
        connect_meta: connect_meta,
        connect_league: connect_league,
        putPlayer: putPlayer,
        getTeam: getTeam,
        getTeams: getTeams
    };
});