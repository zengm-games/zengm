/**
 * @name util.helpers
 * @namespace Various utility functions that don't have anywhere else to go.
 */
define(["globals", "lib/jquery", "lib/knockout"], function (g, $, ko) {
    "use strict";

    /**
     * Validate that a given abbreviation corresponds to a team.
     *
     * If the abbreviation is not valid, then g.userTid and its correspodning abbreviation will be returned.
     *
     * @memberOf util.helpers
     * @param  {string} abbrev Three-letter team abbreviation, like "ATL".
     * @return {Array} Array with two elements, the team ID and the validated abbreviation.
     */
    function validateAbbrev(abbrev) {
        var abbrevs, tid;

        abbrevs = ["ATL", "BOS", "BK", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOR", "NYK", "OKC", "ORL", "PHI", "PHO", "POR", "SAC", "SAS", "TOR", "UTA", "WAS"];
        tid = abbrevs.indexOf(abbrev);

        if (tid < 0) {
            tid = g.userTid;
            abbrev = abbrevs[tid];
        }

        return [tid, abbrev];
    }

    /**
     * Validate that a given team ID corresponds to a team.
     *
     * If the team ID is not valid, then g.userTid and its correspodning abbreviation will be returned.
     *
     * @memberOf util.helpers
     * @param {number|string} tid Integer team ID.
     * @return {Array} Array with two elements, the validated team ID and the corresponding abbreviation.
     */
    function validateTid(tid) {
        var abbrev, abbrevs;

        abbrevs = ["ATL", "BOS", "BK", "CHA", "CHI", "CLE", "DAL", "DEN", "DET", "GSW", "HOU", "IND", "LAC", "LAL", "MEM", "MIA", "MIL", "MIN", "NOR", "NYK", "OKC", "ORL", "PHI", "PHO", "POR", "SAC", "SAS", "TOR", "UTA", "WAS"];
        tid = parseInt(tid, 10);

        if (tid < 0 || tid >= abbrevs.length || isNaN(tid)) {
            tid = g.userTid;
        }
        abbrev = abbrevs[tid];

        return [tid, abbrev];
    }

    /**
     * Get the team abbreviation for a team ID.
     *
     * For instance, team ID 0 is Atlanta, which has an abbreviation of ATL. This is a convenience wrapper around validateTid, excpet it will return "FA" if you pass g.PLAYER.FREE_AGENT.
     *
     * @memberOf util.helpers
     * @param {number|string} tid Integer team ID.
     * @return {string} Abbreviation
     */
    function getAbbrev(tid) {
        var abbrev, result;

        if (tid === g.PLAYER.FREE_AGENT) {
            return "FA";
        }
        if (tid < 0) {
            // Draft prospect or retired
            return "";
        }
        result = validateTid(tid);
        tid = result[0];
        abbrev = result[1];

        return abbrev;
    }

    /**
     * Validate the given season.
     *
     * Currently this doesn't really do anything except replace "undefined" with g.season.
     *
     * @memberOf util.helpers
     * @param {number|string|undefined} season The year of the season to validate. If undefined, then g.season is used.
     * @return {number} Validated season (same as input unless input is undefined, currently).
     */
    function validateSeason(season) {
        if (!season) {
            return g.season;
        }

        season = Math.floor(season);

        if (isNaN(season)) {
            return g.season;
        }

        return season;
    }

    /**
     * Get a list of all seasons that have been played so far, including the current one.
     *
     * @memberOf util.helpers
     * @param {number=} selectedSeason If defined, then a season matching this year will have its "selected" property set to true.
     * @param {number=} ignoredSeason If defined, then a season matching this year will not be present in the output. This is useful if you need a list of seasons that doesn't include the current season, for instance.
     * @return {Array.<Object>} List of seasons. Each element in the list is an object with with two properties: "season" which contains the year, and "selectedSeason" which is a boolean for whether the year matched selectedSeason.
     */
    function getSeasons(selectedSeason, ignoredSeason) {
        var season, seasons;

        selectedSeason = parseInt(selectedSeason, 10);
        ignoredSeason = ignoredSeason !== undefined ? parseInt(ignoredSeason, 10) : null;

        seasons = [];
        for (season = g.startingSeason; season <= g.season; season++) {
            if (season !== ignoredSeason) {
                seasons.push({season: season, selected: selectedSeason === season});
            }
        }
        return seasons;
    }

    /**
     * Get list of teams, along with some metadata
     *
     * Returns an array of 30 teams, sorted by tid. Each element contains an object with the following properties:
     *     tid: Integer team ID (0 to 29).
     *     region: String region name.
     *     name: String team name.
     *     abbrev: String 3-letter team abbreviation.
     *     selected: If selectedTid is defined, this is a boolean representing whether this team is "selected" or not (see below).
     * 
     * @memberOf util.helpers
     * @param {number|string} selectedTid A team ID or abbrev for a team that should be "selected" (as in, from a drop down menu). This will add the "selected" key to each team object, as described above.
     * @return {Array.Object} All teams.
     */
    function getTeams(selectedTid) {
        var i, result, teams;

        selectedTid = selectedTid !== undefined ? selectedTid : -1;

        if (typeof selectedTid === "string") {
            if (isNaN(parseInt(selectedTid, 10))) {
                // It's an abbrev, not a tid!
                result = validateAbbrev(selectedTid);
                selectedTid = result[0];
            }
        }

        teams = [];
        for (i = 0; i < g.numTeams; i++) {
            teams[i] = {
                abbrev: g.teamAbbrevsCache[i],
                region: g.teamRegionsCache[i],
                name: g.teamNamesCache[i]
            };
        }

        if (selectedTid >= 0) {
            for (i = 0; i < teams.length; i++) {
                teams[i].selected = false;
            }
            teams[selectedTid].selected = true;
        }

        return teams;
    }

    /**
     * Get list of teams, along with some more metadata
     *
     * Returns an array of 30 teams. Each array is an object with the following properties:
     *     tid: Integer team ID (0 to 29).
     *     cid: Integer conference ID (0=East, 1=West).
     *     did: Integer division ID.
     *     region: String region name.
     *     name: String team name.
     *     abbrev: String 3-letter team abbreviation.
     *     pop: From http://www.forbes.com/nba-valuations/ number of people in the region, in millions of people.
     *     popRank: Rank of population, 1=largest, 30=smallest.
     *     selected: If selectedTid is defined, this is a boolean representing whether this team is "selected" or not (see below).
     *
     * This should only be used to initialize things, since many of these values can change from their defaults.
     * 
     * @memberOf util.helpers
     * @param {number|string} selectedTid A team ID or abbrev for a team that should be "selected" (as in, from a drop down menu). This will add the "selected" key to each team object, as described above.
     * @return {Array.Object} All teams.
     */
    function getTeamsDefault() {
        return [
            {tid: 0, cid: 0, did: 2, region: "Atlanta", name: "Herons", abbrev: "ATL", pop: 5.4, popRank: 12},
            {tid: 1, cid: 0, did: 0, region: "Boston", name: "Clovers", abbrev: "BOS", pop: 5.0, popRank: 13},
            {tid: 2, cid: 0, did: 0, region: "Brooklyn", name: "Nests", abbrev: "BK", pop: 19.1, popRank: 1},
            {tid: 3, cid: 0, did: 2, region: "Charlotte", name: "Bay Cats", abbrev: "CHA", pop: 1.8, popRank: 24},
            {tid: 4, cid: 0, did: 1, region: "Chicago", name: "Bullies", abbrev: "CHI", pop: 9.6, popRank: 5},
            {tid: 5, cid: 0, did: 1, region: "Cleveland", name: "Cobras", abbrev: "CLE", pop: 2.1, popRank: 20},
            {tid: 6, cid: 1, did: 3, region: "Dallas", name: "Mares", abbrev: "DAL", pop: 6.4, popRank: 6},
            {tid: 7, cid: 1, did: 4, region: "Denver", name: "Ninjas", abbrev: "DEN", pop: 2.6, popRank: 18},
            {tid: 8, cid: 0, did: 1, region: "Detroit", name: "Pumps", abbrev: "DET", pop: 4.4, popRank: 14},
            {tid: 9, cid: 1, did: 5, region: "Golden State", name: "War Machine", abbrev: "GSW", pop: 4.3, popRank: 16},
            {tid: 10, cid: 1, did: 3, region: "Houston", name: "Rock Throwers", abbrev: "HOU", pop: 5.9, popRank: 9},
            {tid: 11, cid: 0, did: 1, region: "Indiana", name: "Passers", abbrev: "IND", pop: 1.7, popRank: 25},
            {tid: 12, cid: 1, did: 5, region: "Los Angeles", name: "Cutters", abbrev: "LAC", pop: 12.9, popRank: 3},
            {tid: 13, cid: 1, did: 5, region: "Los Angeles", name: "Lagoons", abbrev: "LAL", pop: 12.9, popRank: 3},
            {tid: 14, cid: 1, did: 3, region: "Memphis", name: "Growls", abbrev: "MEM", pop: 1.3, popRank: 27},
            {tid: 15, cid: 0, did: 2, region: "Miami", name: "Heatwave", abbrev: "MIA", pop: 5.6, popRank: 11},
            {tid: 16, cid: 0, did: 1, region: "Milwaukee", name: "Buccaneers", abbrev: "MIL", pop: 1.6, popRank: 26},
            {tid: 17, cid: 1, did: 4, region: "Minnesota", name: "Trees", abbrev: "MIN", pop: 3.3, popRank: 17},
            {tid: 18, cid: 1, did: 3, region: "New Orleans", name: "Peloteros", abbrev: "NOR", pop: 1.2, popRank: 28},
            {tid: 19, cid: 0, did: 0, region: "New York", name: "Knights", abbrev: "NYK", pop: 19.1, popRank: 1},
            {tid: 20, cid: 1, did: 4, region: "Oklahoma City", name: "Tornados", abbrev: "OKC", pop: 1.2, popRank: 28},
            {tid: 21, cid: 0, did: 2, region: "Orlando", name: "Mystery", abbrev: "ORL", pop: 2.1, popRank: 20},
            {tid: 22, cid: 0, did: 0, region: "Philadelphia", name: "Steaks", abbrev: "PHI", pop: 6.0, popRank: 7},
            {tid: 23, cid: 1, did: 5, region: "Phoenix", name: "Stars", abbrev: "PHO", pop: 4.4, popRank: 14},
            {tid: 24, cid: 1, did: 4, region: "Portland", name: "Trailer Park", abbrev: "POR", pop: 2.2, popRank: 19},
            {tid: 25, cid: 1, did: 5, region: "Sacramento", name: "Killers", abbrev: "SAC", pop: 2.1, popRank: 20},
            {tid: 26, cid: 1, did: 3, region: "San Antonio", name: "Spurts", abbrev: "SAS", pop: 2.1, popRank: 20},
            {tid: 27, cid: 0, did: 0, region: "Toronto", name: "Ravens", abbrev: "TOR", pop: 6.0, popRank: 7},
            {tid: 28, cid: 1, did: 4, region: "Utah", name: "Jugglers", abbrev: "UTA", pop: 1.0, popRank: 30},
            {tid: 29, cid: 0, did: 2, region: "Washington", name: "Witches", abbrev: "WAS", pop: 5.7, popRank: 10}
        ];
    }

    /**
     * Clones an object.
     * 
     * Taken from http://stackoverflow.com/a/3284324/786644
     *
     * @memberOf util.helpers
     * @param {Object} obj Object to be cloned.
     */
    function deepCopy(obj) {
        var key, retVal;

        if (typeof obj !== "object") { return obj; }
        if (obj.constructor === RegExp) { return obj; }

        retVal = new obj.constructor();
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                retVal[key] = deepCopy(obj[key]);
            }
        }
        return retVal;
    }

    /**
     * Display a whole-page error message to the user.
     * 
     * @memberOf util.helpers
     * @param {Object} req Object with parameter "params" containing another object with a string representing the error message in the parameter "error".
     */
    function globalError(req) {
        var data, ui, viewHelpers;

        ui = require("ui");
        viewHelpers = require("util/viewHelpers");

        viewHelpers.beforeNonLeague();

        ui.update({
            container: "content",
            template: "error"
        });
        ko.applyBindings({error: req.params.error}, document.getElementById("content"));
        ui.title("Error");
        req.raw.cb();
    }

    /**
     * Display a whole-page error message to the user, while retaining the league menu.
     * 
     * @memberOf util.helpers
     * @param {Object} req Object with parameter "params" containing another object with a string representing the error message in the parameter "error" and an integer league ID in "lid".
     */
    function leagueError(req) {
        var ui, viewHelpers;

        ui = require("ui");
        viewHelpers = require("util/viewHelpers");

        viewHelpers.beforeLeague(req, function () {
            ui.update({
                container: "league_content",
                template: "error"
            });
            ko.applyBindings({error: req.params.error}, document.getElementById("league_content"));
            ui.title("Error");
            req.raw.cb();
        });
    }

    /**
     * Display a whole-page error message to the user by calling either views.leagueError or views.globalError as appropriate.
     * 
     * @memberOf util.helpers
     * @param {string} error Text of the error message to be displayed.
     * @param {function()} cb Optional callback function.
     */
    function error(errorText, cb) {
        var lid, req;

        req = {params: {error: errorText}, raw: {cb: cb !== undefined ? cb : function () {}}};

        lid = location.pathname.split("/")[2]; // lid derived from URL
        if (/^\d+$/.test(lid) && typeof indexedDB !== "undefined") { // Show global error of no IndexedDB
            req.params.lid = parseInt(lid, 10);
            leagueError(req);
        } else {
            globalError(req);
        }
    }

    /**
     * Delete all the things from the global variable g that are not stored in league databases.
     *
     * This is used to clear out values from other leagues, to ensure that the appropriate values are updated in the database when calling db.setGameAttributes.
     * 
     * @memberOf util.helpers
     */
    function resetG() {
        var key;

        for (key in g) {
            if (g.hasOwnProperty(key) && g.notInDb.indexOf(key) < 0) {
                delete g[key];
            }
        }
    }

    /**
     * Ping a counter at basketball-gm.com.
     *
     * This should only do something if it isn't being run from a unit test and it's actually on basketball-gm.com.
     *
     * @memberOf util.helpers
     * @param {string} type Either "league" for a new league, or "season" for a completed season
     */
    function bbgmPing(type) {
        if (g.enableLogging) {
            if (type === "league") {
                _gaq.push(["_trackEvent", "BBGM", "New league", g.lid.toString()]);
            } else if (type === "season") {
                _gaq.push(["_trackEvent", "BBGM", "Completed season", g.season.toString()]);
            }
        }
    }

    /**
     * Generate a block of HTML with a player's skill labels.
     *
     * @memberOf util.helpers
     * @param {Array.<string>} skills Array of skill labels, like "R" for "Rebounder", etc. See: core.player.skills.
     * @return {string} String of HTML-formatted skill labels, ready for output.
     */
    function skillsBlock(skills) {
        var i, skillsHtml, tooltips;

        tooltips = {
            "3": "Three Point Shooter",
            A: "Athlete",
            B: "Ball Handler",
            Di: "Interior Defender",
            Dp: "Perimeter Defender",
            Po: "Post Scorer",
            Ps: "Passer",
            R: "Rebounder"
        };

        skillsHtml = '';
        if (skills !== undefined) {
            for (i = 0; i < skills.length; i++) {
                skillsHtml += '<span class="skill" title="' + tooltips[skills[i]] + '">' + skills[i] + '</span>';
            }
        }

        return skillsHtml;
    }

    /**
     * Create a URL for a page within a league.
     *
     * This will also maintain any query string on the end of the URL, for instance for popup windows, unless options.noQueryString is set. Ignoring the query string can be important for forms in Davis.js until this is fixed: https://github.com/olivernn/davis.js/issues/75
     * 
     * @param {Array.<string|number>} components Array of components for the URL after the league ID, which will be combined with / in between.
     * @return {string} URL
     */
    function leagueUrl(components, options) {
        var i, url;

        options = options !== undefined ? options : {};

        url = "/l/" + g.lid;
        for (i = 0; i < components.length; i++) {
            if (components[i] !== undefined) {
                url += "/" + ko.utils.unwrapObservable(components[i]);
            }
        }
        if (!options.noQueryString) {
            url += location.search;
        }

        return url;
    }

    /**
     * Generate a block of HTML with a player's name, skill labels.
     *
     * @memberOf util.helpers
     * @param {number} pid Player ID number.
     * @param {string} name Player name.
     * @param {object} object Injury object (properties: type and gamesRemaining).
     * @param {Array.<string>} skills Array of skill labels, like "R" for "Rebounder", etc. See: core.player.skills.
     * @return {string} String of HTML-formatted skill labels, ready for output.
     */
    function playerNameLabels(pid, name, injury, skills) {
        var html;

        html = '<a href="' + leagueUrl(["player", pid]) + '">' + name + '</a>';
        if (injury.gamesRemaining > 0) {
            html += '<span class="label label-important label-injury" title="' + injury.type + ' (out ' + injury.gamesRemaining + ' more games)">' + injury.gamesRemaining + '</span>';
        } else if (injury.gamesRemaining === -1) {
            // This is used in box scores, where it would be confusing to display "out X more games" in old box scores
            html += '<span class="label label-important label-injury" title="' + injury.type + '">&nbsp;</span>';
        }
        html += skillsBlock(skills);

        return html;
    }

    /**
     * Round a number to a certain number of decimal places.
     * 
     * @memberOf util.helpers
     * @param {number|string} value Number to round.
     * @param {number=} precision Number of decimal places. Default is 0 (round to integer).
     * @return {string} Rounded number.
     */
    function round(value, precision) {
        precision = precision !== undefined ? parseInt(precision, 10) : 0;

        return parseFloat(value).toFixed(precision);
    }

    /**
     * Pad an array with nulls or truncate it so that it has a fixed length.
     * 
     * @memberOf util.helpers
     * @param {Array} array Input array.
     * @param {number} length Desired length.
     * @return {Array} Original array padded with null or truncated so that it has the required length.
     */
    function nullPad(array, length) {
        if (array.length > length) {
            return array.slice(0, length);
        }

        while (array.length < length) {
            array.push(null);
        }

        return array;
    }

    /**
     * Format a number as currency, correctly handling negative values.
     *
     * @memberOf util.helpers
     * @param {number|string} amount Input value.
     * @param {string=} append Suffix to append to the number, like "M" for things like $2M.
     * @param {number|string|undefined} precision Number of decimal places. Default is 2 (like $17.62).
     * @return {string} Formatted currency string.
     */
    function formatCurrency(amount, append, precision) {
        append = typeof append === "string" ? append : "";
        precision = typeof precision === "number" || typeof precision === "string" ? precision : 2;

        if (amount < 0) {
            return "-$" + round(Math.abs(amount), precision) + append;
        }
        return "$" + round(amount, precision) + append;
    }

    /**
     * Format a number with commas in the thousands places.
     *
     * Also, rounds the number first.
     * 
     * @memberOf util.helpers
     * @param {number|string} x Input number.
     * @return {string} Formatted number.
     */
    function numberWithCommas(x) {
        x = round(x);
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Bound a number so that it can't exceed min and max values.
     *
     * @memberOf util.helpers
     * @param {number} x Input number.
     * @param {number} min Minimum bounding variable.
     * @param {number} max Maximum bounding variable.
     * @return {number} Bounded number.
     */
    function bound(x, min, max) {
        if (x < min) {
            return min;
        }
        if (x > max) {
            return max;
        }
        return x;
    }


    /**
     * Link to an abbrev either as "ATL" or "ATL (from BOS)" if a pick was traded.
     *
     * @memberOf util.helpers
     * @param {string} abbrev Drafting team (ATL).
     * @param {string} originalAbbrev Original owner of the pick (BOS).
     * @param {season=} season Optional season for the roster links.
     * @return {string} HTML link(s).
     */
    function draftAbbrev(abbrev, originalAbbrev, season) {
        if (abbrev === originalAbbrev) {
            return '<a href="' + leagueUrl(["roster", abbrev, season]) + '">' + abbrev + '</a>';
        }

        return '<a href="' + leagueUrl(["roster", abbrev, season]) + '">' + abbrev + '</a> (from <a href="' + leagueUrl(["roster", originalAbbrev, season]) + '">' + originalAbbrev + '</a>)';
    }

    return {
        validateAbbrev: validateAbbrev,
        getAbbrev: getAbbrev,
        validateTid: validateTid,
        validateSeason: validateSeason,
        getSeasons: getSeasons,
        getTeams: getTeams,
        getTeamsDefault: getTeamsDefault,
        deepCopy: deepCopy,
        error: error,
        resetG: resetG,
        bbgmPing: bbgmPing,
        skillsBlock: skillsBlock,
        playerNameLabels: playerNameLabels,
        round: round,
        nullPad: nullPad,
        formatCurrency: formatCurrency,
        numberWithCommas: numberWithCommas,
        bound: bound,
        leagueUrl: leagueUrl,
        draftAbbrev: draftAbbrev
    };
});
