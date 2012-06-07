var db = {
    connect_meta: function () {
        var request = indexedDB.open("meta", 1);
        request.onerror = function(event) {
            console.log("Connection error");
        };
        request.onblocked = function() { dbm.close(); };
        request.onupgradeneeded = function(event) {
            console.log("Upgrading meta database");

            dbm = event.target.result;

            var leagueStore = dbm.createObjectStore("leagues", {keyPath: "lid", autoIncrement: true});
            var teamStore = dbm.createObjectStore("teams", {keyPath: "tid"});
            teamStore.createIndex("did", "did", {unique: false});

            var teams = [
                {"tid": 0, "did": 2, "region": "Atlanta", "name": "Herons", "abbrev": "ATL"},
                {"tid": 1, "did": 0, "region": "Boston", "name": "Clovers", "abbrev": "BOS"},
                {"tid": 2, "did": 2, "region": "Charlotte", "name": "Bay Cats", "abbrev": "CHA"},
                {"tid": 3, "did": 1, "region": "Chicago", "name": "Bullies", "abbrev": "CHI"},
                {"tid": 4, "did": 1, "region": "Cleveland", "name": "Cobras", "abbrev": "CLE"},
                {"tid": 5, "did": 3, "region": "Dallas", "name": "Mares", "abbrev": "DAL"},
                {"tid": 6, "did": 4, "region": "Denver", "name": "Ninjas", "abbrev": "DEN"},
                {"tid": 7, "did": 1, "region": "Detroit", "name": "Pumps", "abbrev": "DET"},
                {"tid": 8, "did": 5, "region": "Golden State", "name": "War Machine", "abbrev": "GSW"},
                {"tid": 9, "did": 3, "region": "Houston", "name": "Rock Throwers", "abbrev": "HOU"},
                {"tid": 10, "did": 1, "region": "Indiana", "name": "Passers", "abbrev": "IND"},
                {"tid": 11, "did": 5, "region": "Los Angeles", "name": "Cutters", "abbrev": "LAC"},
                {"tid": 12, "did": 5, "region": "Los Angeles", "name": "Lagoons", "abbrev": "LAL"},
                {"tid": 13, "did": 3, "region": "Memphis", "name": "Growls", "abbrev": "MEM"},
                {"tid": 14, "did": 2, "region": "Miami", "name": "Heatwave", "abbrev": "MIA"},
                {"tid": 15, "did": 1, "region": "Milwaukee", "name": "Buccaneers", "abbrev": "MIL"},
                {"tid": 16, "did": 4, "region": "Minnesota", "name": "Trees", "abbrev": "MIN"},
                {"tid": 17, "did": 0, "region": "New Jersey", "name": "Nests", "abbrev": "NJN"},
                {"tid": 18, "did": 3, "region": "New Orleans", "name": "Honey Bees", "abbrev": "NOR"},
                {"tid": 19, "did": 0, "region": "New York", "name": "Knights", "abbrev": "NYK"},
                {"tid": 20, "did": 2, "region": "Orlando", "name": "Mystery", "abbrev": "ORL"},
                {"tid": 21, "did": 0, "region": "Philadelphia", "name": "Steaks", "abbrev": "PHI"},
                {"tid": 22, "did": 5, "region": "Phoenix", "name": "Stars", "abbrev": "PHO"},
                {"tid": 23, "did": 4, "region": "Portland", "name": "Trailer Park", "abbrev": "POR"},
                {"tid": 24, "did": 5, "region": "Sacramento", "name": "Killers", "abbrev": "SAC"},
                {"tid": 25, "did": 3, "region": "San Antonio", "name": "Spurts", "abbrev": "SAS"},
                {"tid": 26, "did": 4, "region": "Seattle", "name": "Sudoers", "abbrev": "SEA"},
                {"tid": 27, "did": 0, "region": "Toronto", "name": "Ravens", "abbrev": "TOR"},
                {"tid": 28, "did": 4, "region": "Utah", "name": "Jugglers", "abbrev": "UTA"},
                {"tid": 29, "did": 2, "region": "Washington", "name": "Witches", "abbrev": "WAS"}
            ];
            for (i in teams) {
                teamStore.add(teams[i]);
            }
        }
        return request;
    },

    connect_league: function (lid) {
        var request = indexedDB.open("league" + lid, 1);
        request.onerror = function(event) {
            console.log("Connection error");
        };
        request.onblocked = function() { dbm.close(); };
        request.onupgradeneeded = function(event) {
            console.log("Upgrading league" + lid + " database");

            dbl = event.target.result;

            // rid ("row id") is used as the keyPath for objects without an innate unique identifier
            var playerStore = dbl.createObjectStore("players", {keyPath: "pid", autoIncrement: true});
            var playerRatingStore = dbl.createObjectStore("playerRatings", {keyPath: "rid"});
            var playerStatStore = dbl.createObjectStore("playerStats", {keyPath: "rid"});
            var teamStore = dbl.createObjectStore("teams", {keyPath: "rid"});
            var teamStatStore = dbl.createObjectStore("teamStats", {keyPath: "rid"});
            var gameResultStore = dbl.createObjectStore("gameResults", {keyPath: "gid"});
            // ... other stores go here later

            playerStore.createIndex("tid", "tid", {unique: false});
            playerRatingStore.createIndex("pid", "pid", {unique: false});
            playerRatingStore.createIndex("season", "season", {unique: false});
            playerStatStore.createIndex("pid", "pid", {unique: false});
            playerStatStore.createIndex("tid", "tid", {unique: false});
            playerStatStore.createIndex("season", "season", {unique: false});
            teamStore.createIndex("tid", "tid", {unique: false});
            teamStore.createIndex("cid", "cid", {unique: false});
            teamStore.createIndex("did", "did", {unique: false});
            teamStore.createIndex("season", "season", {unique: false});
            teamStatStore.createIndex("tid", "tid", {unique: false});
            teamStatStore.createIndex("season", "season", {unique: false});
            gameResultStore.createIndex("tid", "tid", {unique: false});
            gameResultStore.createIndex("season", "season", {unique: false});
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
