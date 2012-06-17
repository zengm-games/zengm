define([], function() {
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

                var teams = [
                    {"tid": 0, "cid": 0, "did": 2, "region": "Atlanta", "name": "Herons", "abbrev": "ATL"},
                    {"tid": 1, "cid": 0, "did": 0, "region": "Boston", "name": "Clovers", "abbrev": "BOS"},
                    {"tid": 2, "cid": 0, "did": 2, "region": "Charlotte", "name": "Bay Cats", "abbrev": "CHA"},
                    {"tid": 3, "cid": 0, "did": 1, "region": "Chicago", "name": "Bullies", "abbrev": "CHI"},
                    {"tid": 4, "cid": 0, "did": 1, "region": "Cleveland", "name": "Cobras", "abbrev": "CLE"},
                    {"tid": 5, "cid": 1, "did": 3, "region": "Dallas", "name": "Mares", "abbrev": "DAL"},
                    {"tid": 6, "cid": 1, "did": 4, "region": "Denver", "name": "Ninjas", "abbrev": "DEN"},
                    {"tid": 7, "cid": 0, "did": 1, "region": "Detroit", "name": "Pumps", "abbrev": "DET"},
                    {"tid": 8, "cid": 1, "did": 5, "region": "Golden State", "name": "War Machine", "abbrev": "GSW"},
                    {"tid": 9, "cid": 1, "did": 3, "region": "Houston", "name": "Rock Throwers", "abbrev": "HOU"},
                    {"tid": 10, "cid": 0, "did": 1, "region": "Indiana", "name": "Passers", "abbrev": "IND"},
                    {"tid": 11, "cid": 1, "did": 5, "region": "Los Angeles", "name": "Cutters", "abbrev": "LAC"},
                    {"tid": 12, "cid": 1, "did": 5, "region": "Los Angeles", "name": "Lagoons", "abbrev": "LAL"},
                    {"tid": 13, "cid": 1, "did": 3, "region": "Memphis", "name": "Growls", "abbrev": "MEM"},
                    {"tid": 14, "cid": 0, "did": 2, "region": "Miami", "name": "Heatwave", "abbrev": "MIA"},
                    {"tid": 15, "cid": 0, "did": 1, "region": "Milwaukee", "name": "Buccaneers", "abbrev": "MIL"},
                    {"tid": 16, "cid": 1, "did": 4, "region": "Minnesota", "name": "Trees", "abbrev": "MIN"},
                    {"tid": 17, "cid": 0, "did": 0, "region": "New Jersey", "name": "Nests", "abbrev": "NJN"},
                    {"tid": 18, "cid": 1, "did": 3, "region": "New Orleans", "name": "Honey Bees", "abbrev": "NOR"},
                    {"tid": 19, "cid": 0, "did": 0, "region": "New York", "name": "Knights", "abbrev": "NYK"},
                    {"tid": 20, "cid": 0, "did": 2, "region": "Orlando", "name": "Mystery", "abbrev": "ORL"},
                    {"tid": 21, "cid": 0, "did": 0, "region": "Philadelphia", "name": "Steaks", "abbrev": "PHI"},
                    {"tid": 22, "cid": 1, "did": 5, "region": "Phoenix", "name": "Stars", "abbrev": "PHO"},
                    {"tid": 23, "cid": 1, "did": 4, "region": "Portland", "name": "Trailer Park", "abbrev": "POR"},
                    {"tid": 24, "cid": 1, "did": 5, "region": "Sacramento", "name": "Killers", "abbrev": "SAC"},
                    {"tid": 25, "cid": 1, "did": 3, "region": "San Antonio", "name": "Spurts", "abbrev": "SAS"},
                    {"tid": 26, "cid": 1, "did": 4, "region": "Seattle", "name": "Sudoers", "abbrev": "SEA"},
                    {"tid": 27, "cid": 0, "did": 0, "region": "Toronto", "name": "Ravens", "abbrev": "TOR"},
                    {"tid": 28, "cid": 1, "did": 4, "region": "Utah", "name": "Jugglers", "abbrev": "UTA"},
                    {"tid": 29, "cid": 0, "did": 2, "region": "Washington", "name": "Witches", "abbrev": "WAS"}
                ];
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
