define([], function() {
    /*Validate that the given abbreviation corresponds to a valid team.

    If an invalid abbreviation is passed, the user's team will be used.

    Args:
        abbrev: Three-letter all-caps string containing a team's
            abbreviation.
    Returns:
        A two element list of the validated team ID and abbreviation.
    */
    function validateAbbrev(abbrev) {
        var abbrevs = ["ATL", "BOS", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NJN", "NOR", "NYK", "ORL", "PHI", "PHO", "POR", "SAC", "SAS", "SEA", "TOR", "UTA", "WAS"];
        var tid = abbrevs.indexOf(abbrev);

        if (tid < 0) {
            tid = g.userTid;
            abbrev = abbrevs[tid];
        }

        return [tid, abbrev];
    }

    /* Same as validateAbbrev, but for tid. */
    function validateTid(tid) {
        var abbrevs = ["ATL", "BOS", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NJN", "NOR", "NYK", "ORL", "PHI", "PHO", "POR", "SAC", "SAS", "SEA", "TOR", "UTA", "WAS"];
        var tid = parseInt(tid, 10);

        if (tid < 0 || tid >= abbrevs.length) {
            tid = g.userTid;
        }
        abbrev = abbrevs[tid];
        
        return [tid, abbrev];
    }

    /*Validate that the given season is valid.

    A valid season is the current season or one of the past seasons. If an
    invalid season is passed, the current will be used.

    Args:
        season: An integer containing the year of the season.
    Returns:
        An integer containing the argument, if valid, or the year of the current
        season.
    */
    function validateSeason(season) {
        if (!season) {
            season = g.season
        }
        else {
            // Make sure there is an entry for the supplied season in the DB somewhere
            season = parseInt(season, 10);
        }

        return season;
    }

    /*Returns a list of all the seasons, past and present.*/
    function getSeasons(selectedSeason) {
        selectedSeason = parseInt(selectedSeason, 10);
        var seasons = [];
        for (var season=g.startingSeason; season<=g.season; season++) {
            seasons.push({season: season, selected: selectedSeason===season});
        }
        return seasons;
    }

    /*Returns a list of all the teams. If selectedTid is passed, then the "selected" property will be added to each team, true only for selectedTid and false otherwise.*/
    function getTeams(selectedTid) {
        selectedTid = typeof selectedTid !== "undefined" ? parseInt(selectedTid, 10) : -1;
        var teams = [
            {tid: 0, cid: 0, did: 2, region: "Atlanta", name: "Herons", abbrev: "ATL"},
            {tid: 1, cid: 0, did: 0, region: "Boston", name: "Clovers", abbrev: "BOS"},
            {tid: 2, cid: 0, did: 2, region: "Charlotte", name: "Bay Cats", abbrev: "CHA"},
            {tid: 3, cid: 0, did: 1, region: "Chicago", name: "Bullies", abbrev: "CHI"},
            {tid: 4, cid: 0, did: 1, region: "Cleveland", name: "Cobras", abbrev: "CLE"},
            {tid: 5, cid: 1, did: 3, region: "Dallas", name: "Mares", abbrev: "DAL"},
            {tid: 6, cid: 1, did: 4, region: "Denver", name: "Ninjas", abbrev: "DEN"},
            {tid: 7, cid: 0, did: 1, region: "Detroit", name: "Pumps", abbrev: "DET"},
            {tid: 8, cid: 1, did: 5, region: "Golden State", name: "War Machine", abbrev: "GSW"},
            {tid: 9, cid: 1, did: 3, region: "Houston", name: "Rock Throwers", abbrev: "HOU"},
            {tid: 10, cid: 0, did: 1, region: "Indiana", name: "Passers", abbrev: "IND"},
            {tid: 11, cid: 1, did: 5, region: "Los Angeles", name: "Cutters", abbrev: "LAC"},
            {tid: 12, cid: 1, did: 5, region: "Los Angeles", name: "Lagoons", abbrev: "LAL"},
            {tid: 13, cid: 1, did: 3, region: "Memphis", name: "Growls", abbrev: "MEM"},
            {tid: 14, cid: 0, did: 2, region: "Miami", name: "Heatwave", abbrev: "MIA"},
            {tid: 15, cid: 0, did: 1, region: "Milwaukee", name: "Buccaneers", abbrev: "MIL"},
            {tid: 16, cid: 1, did: 4, region: "Minnesota", name: "Trees", abbrev: "MIN"},
            {tid: 17, cid: 0, did: 0, region: "New Jersey", name: "Nests", abbrev: "NJN"},
            {tid: 18, cid: 1, did: 3, region: "New Orleans", name: "Honey Bees", abbrev: "NOR"},
            {tid: 19, cid: 0, did: 0, region: "New York", name: "Knights", abbrev: "NYK"},
            {tid: 20, cid: 0, did: 2, region: "Orlando", name: "Mystery", abbrev: "ORL"},
            {tid: 21, cid: 0, did: 0, region: "Philadelphia", name: "Steaks", abbrev: "PHI"},
            {tid: 22, cid: 1, did: 5, region: "Phoenix", name: "Stars", abbrev: "PHO"},
            {tid: 23, cid: 1, did: 4, region: "Portland", name: "Trailer Park", abbrev: "POR"},
            {tid: 24, cid: 1, did: 5, region: "Sacramento", name: "Killers", abbrev: "SAC"},
            {tid: 25, cid: 1, did: 3, region: "San Antonio", name: "Spurts", abbrev: "SAS"},
            {tid: 26, cid: 1, did: 4, region: "Seattle", name: "Sudoers", abbrev: "SEA"},
            {tid: 27, cid: 0, did: 0, region: "Toronto", name: "Ravens", abbrev: "TOR"},
            {tid: 28, cid: 1, did: 4, region: "Utah", name: "Jugglers", abbrev: "UTA"},
            {tid: 29, cid: 0, did: 2, region: "Washington", name: "Witches", abbrev: "WAS"}
        ];

        if (selectedTid >= 0) {
            for (var i=0; i<teams.length; i++) {
                teams[i].selected = false;
            }
            teams[selectedTid].selected = true;
        }
        
        return teams;
    }

    /*Injects the game attributes stored in localStorage into the g object.*/
    function loadGameAttributes() {
        gameAttributes = JSON.parse(localStorage.getItem("league" + g.lid + "GameAttributes"));
        for (var prop in gameAttributes) {
            if (gameAttributes.hasOwnProperty(prop)) {
                g[prop] = gameAttributes[prop];
            }
        }
    }

    /*Takes an object and stores the properties (updating or inserting) in gameAttributes and g.*/
    function setGameAttributes(gameAttributes) {
        gameAttributesOld = JSON.parse(localStorage.getItem("league" + g.lid + "GameAttributes"));
        if (gameAttributesOld === null) {
            gameAttributesOld = {};
        }
        for (var prop in gameAttributes) {
            if (gameAttributes.hasOwnProperty(prop)) {
                gameAttributesOld[prop] = gameAttributes[prop];
                g[prop] = gameAttributes[prop];
            }
        }
        localStorage.setItem("league" + g.lid + "GameAttributes", JSON.stringify(gameAttributesOld));
    }


    /**
     * Clones an object. Otherwise, passing the team objects and modifying them in
     * here will fuck up future simulations of the same team if a team plays more
     * than one game in a day. Taken from http://stackoverflow.com/a/3284324/786644
     */
    function deepCopy(obj) {
        if (typeof obj !== "object") return obj;
        if (obj.constructor === RegExp) return obj;

        var retVal = new obj.constructor();
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) continue;
            retVal[key] = deepCopy(obj[key]);
        }
        return retVal;
    }

    return {
        validateAbbrev: validateAbbrev,
        validateTid: validateTid,
        validateSeason: validateSeason,
        getSeasons: getSeasons,
        getTeams: getTeams,
        loadGameAttributes: loadGameAttributes,
        setGameAttributes: setGameAttributes,
        deepCopy: deepCopy
    }
});
