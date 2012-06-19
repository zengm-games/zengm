define(["util/helpers"], function(helpers) {
    return {
        connect_meta: function () {
            console.log('Connecting to database "meta"');
            var request = g.indexedDB.open("meta", 1);
            request.onerror = function(event) {
                console.log("Connection error");
            };
            request.onblocked = function() { g.dbm.close(); };
            request.onupgradeneeded = function(event) {
                console.log("Upgrading meta database");

                g.dbm = event.target.result;

                var leagueStore = g.dbm.createObjectStore("leagues", {keyPath: "lid", autoIncrement: true});
                var teamStore = g.dbm.createObjectStore("teams", {keyPath: "tid"});
                teamStore.createIndex("cid", "cid", {unique: false});
                teamStore.createIndex("did", "did", {unique: false});

                var teams = helpers.getTeams();
                for (i in teams) {
                    teamStore.add(teams[i]);
                }
            }
            return request;
        },

        connect_league: function (lid) {
            console.log('Connecting to database "league' + lid + '"');
            var request = g.indexedDB.open("league" + lid, 1);
            request.onerror = function(event) {
                console.log("Connection error");
            };
            request.onblocked = function() { g.dbl.close(); };
            request.onupgradeneeded = function(event) {
                console.log("Upgrading league" + lid + " database");

                g.dbl = event.target.result;

                // rid ("row id") is used as the keyPath for objects without an innate unique identifier
                var playerStore = g.dbl.createObjectStore("players", {keyPath: "pid", autoIncrement: true});
                var teamStore = g.dbl.createObjectStore("teams", {keyPath: "rid", autoIncrement: true});
                var gameStore = g.dbl.createObjectStore("games", {keyPath: "gid"});
                var scheduleStore = g.dbl.createObjectStore("schedule", {keyPath: "gid", autoIncrement: true});
                var playoffSeriesStore = g.dbl.createObjectStore("playoffSeries", {keyPath: "season"});
                // ... other stores go here later

                playerStore.createIndex("tid", "tid", {unique: false});
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
            }
            return request;
        },

        getAll: function (db, obj, cb) {
            var objects = [];
            var objectStore = db.transaction(obj).objectStore(obj);
            objectStore.openCursor().onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {
                    objects.push(cursor.value);
                    cursor.continue();
                }
                else {
                    cb(objects);
                }
            };
        }
    };
});
