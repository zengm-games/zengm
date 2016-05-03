var g = require('../globals');
var ui = require('../ui');
var league = require('../core/league');
var bbgmView = require('../util/bbgmView');

function genFileName(data) {
    var fileName, i, leagueName, playoffSeries, rnd, season, series;

    leagueName = data.meta !== undefined ? data.meta.name : ("League " + g.lid);

    fileName = "BBGM_" + leagueName.replace(/[^a-z0-9]/gi, '_') + "_" + g.season + "_" + g.PHASE_TEXT[g.phase].replace(/[^a-z0-9]/gi, '_');

    if (g.phase === g.PHASE.REGULAR_SEASON && data.hasOwnProperty("teams")) {
        season = data.teams[g.userTid].seasons[data.teams[g.userTid].seasons.length - 1];
        fileName += "_" + season.won + "-" + season.lost;
    }

    if (g.phase === g.PHASE.PLAYOFFS && data.hasOwnProperty("playoffSeries")) {
        console.log(data.playoffSeries);
        // Most recent series info
        playoffSeries = data.playoffSeries[data.playoffSeries.length - 1];
        rnd = playoffSeries.currentRound;
        fileName += "_Round_" + (playoffSeries.currentRound + 1);

        // Find the latest playoff series with the user's team in it
        series = playoffSeries.series;
        for (i = 0; i < series[rnd].length; i++) {
            if (series[rnd][i].home.tid === g.userTid) {
                fileName += "_" + series[rnd][i].home.won + "-" + series[rnd][i].away.won;
            } else if (series[rnd][i].away.tid === g.userTid) {
                fileName += "_" + series[rnd][i].away.won + "-" + series[rnd][i].home.won;
            }
        }
    }

    return fileName + ".json";
}

function post(req) {
    var downloadLink, objectStores;

    downloadLink = document.getElementById("download-link");
    downloadLink.innerHTML = "Generating...";

    // Get array of object stores to export
    objectStores = req.params.objectStores.join(",").split(",");

    // Can't export player stats without players
    if (objectStores.indexOf("playerStats") >= 0 && objectStores.indexOf("players") === -1) {
        downloadLink.innerHTML = '<span class="text-danger">You can\'t export player stats without exporting players!</span>';
        return;
    }

    league.exportLeague(objectStores).then(function (data) {
        var a, blob, fileName, json, url;

        json = JSON.stringify(data, undefined, 2);
        blob = new Blob([json], {type: "application/json"});
        url = window.URL.createObjectURL(blob);

        fileName = genFileName(data);

        a = document.createElement("a");
        a.download = fileName;
        a.href = url;
        a.textContent = "Download Exported League File";
        a.dataset.noDavis = "true";
//                a.click(); // Works in Chrome to auto-download, but not Firefox http://stackoverflow.com/a/20194533/786644

        downloadLink.innerHTML = ""; // Clear "Generating..."
        downloadLink.appendChild(a);

        // Delete object, eventually
        window.setTimeout(function () {
            window.URL.revokeObjectURL(url);
            downloadLink.innerHTML = "Download link expired."; // Remove expired link
        }, 60 * 1000);
    });
}

function updateExportLeague(inputs, updateEvents) {
    var categories;

    if (updateEvents.indexOf("firstRun") >= 0) {
        categories = [{
            objectStores: "players,releasedPlayers,awards",
            name: "Players",
            desc: "All player info, ratings, and awards - but not stats!",
            checked: true
        }, {
            objectStores: "playerStats",
            name: "Player Stats",
            desc: "All player stats.",
            checked: true
        }, {
            objectStores: "teams,teamSeasons,teamStats",
            name: "Teams",
            desc: "All team info and stats.",
            checked: true
        }, {
            objectStores: "schedule,playoffSeries",
            name: "Schedule",
            desc: "Current regular season schedule and playoff series.",
            checked: true
        }, {
            objectStores: "draftPicks",
            name: "Draft Picks",
            desc: "Traded draft picks.",
            checked: true
        }, {
            objectStores: "trade,negotiations,gameAttributes,draftOrder,messages,events,playerFeats",
            name: "Game State",
            desc: "Interactions with the owner, current contract negotiations, current game phase, etc. Useful for saving or backing up a game, but not for creating custom rosters to share.",
            checked: true
        }, {
            objectStores: "games",
            name: "Box Scores",
            desc: '<span class="text-danger">If you\'ve played more than a few seasons, this takes up a ton of space!</span>',
            checked: false
        }];
        return {categories: categories};
    }
}

function uiFirst() {
    ui.title("Export League");
}

module.exports = bbgmView.init({
    id: "exportLeague",
    post: post,
    runBefore: [updateExportLeague],
    uiFirst: uiFirst
});
