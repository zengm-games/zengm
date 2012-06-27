define(["util/helpers"], function (helpers) {
    "use strict";

    return {
        connect_meta: function () {
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
        },

        connect_league: function (lid) {
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
                playerStore.createIndex("stats.tid", "stats.tid", {unique: false});
                playerStore.createIndex("stats.season", "stats.season", {unique: false});
                playerStore.createIndex("stats.playoffs", "stats.playoffs", {unique: false});
                teamStore.createIndex("tid", "tid", {unique: false});
                teamStore.createIndex("cid", "cid", {unique: false});
                teamStore.createIndex("did", "did", {unique: false});
                teamStore.createIndex("season", "season", {unique: false});
                teamStore.createIndex("stats.playoffs", "stats.playoffs", {unique: false});
//                gameStore.createIndex("tid", "tid", {unique: false}); // Not used because it's useless without oppTid checking too
                gameStore.createIndex("season", "season", {unique: false});
            };
            return request;
        }
    };
});
