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
        localStorage.setItem("league" + lid + "GameAttributes", JSON.stringify(gameAttributesOld));
    }

    return {
        validateAbbrev: validateAbbrev,
        validateTid: validateTid,
        validateSeason: validateSeason,
        getSeasons: getSeasons,
        loadGameAttributes: loadGameAttributes,
        setGameAttributes: setGameAttributes
    }
});
