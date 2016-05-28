const g = require('../globals');
const ui = require('../ui');
const league = require('../core/league');
const bbgmView = require('../util/bbgmView');

function genFileName(data) {
    const leagueName = data.meta !== undefined ? data.meta.name : `League ${g.lid}`;

    let fileName = `BBGM_${leagueName.replace(/[^a-z0-9]/gi, '_')}_${g.season}_${g.PHASE_TEXT[g.phase].replace(/[^a-z0-9]/gi, '_')}`;

    if (g.phase === g.PHASE.REGULAR_SEASON && data.hasOwnProperty("teams")) {
        const season = data.teams[g.userTid].seasons[data.teams[g.userTid].seasons.length - 1];
        fileName += `_${season.won}-${season.lost}`;
    }

    if (g.phase === g.PHASE.PLAYOFFS && data.hasOwnProperty("playoffSeries")) {
        // Most recent series info
        const playoffSeries = data.playoffSeries[data.playoffSeries.length - 1];
        const rnd = playoffSeries.currentRound;
        fileName += `_Round_${playoffSeries.currentRound + 1}`;

        // Find the latest playoff series with the user's team in it
        const series = playoffSeries.series;
        for (let i = 0; i < series[rnd].length; i++) {
            if (series[rnd][i].home.tid === g.userTid) {
                fileName += `_${series[rnd][i].home.won}-${series[rnd][i].away.won}`;
            } else if (series[rnd][i].away.tid === g.userTid) {
                fileName += `_${series[rnd][i].away.won}-${series[rnd][i].home.won}`;
            }
        }
    }

    return `${fileName}.json`;
}

async function post(req) {
    const downloadLink = document.getElementById("download-link");
    downloadLink.innerHTML = "Generating...";

    // Get array of object stores to export
    const objectStores = req.params.objectStores.join(",").split(",");

    // Can't export player stats without players
    if (objectStores.indexOf("playerStats") >= 0 && objectStores.indexOf("players") === -1) {
        downloadLink.innerHTML = '<span class="text-danger">You can\'t export player stats without exporting players!</span>';
        return;
    }

    const data = await league.exportLeague(objectStores);

    const json = JSON.stringify(data, undefined, 2);
    const blob = new Blob([json], {type: "application/json"});
    const url = window.URL.createObjectURL(blob);
    const fileName = genFileName(data);

    const a = document.createElement("a");
    a.download = fileName;
    a.href = url;
    a.textContent = "Download Exported League File";
    a.dataset.noDavis = "true";
//    a.click(); // Works in Chrome to auto-download, but not Firefox http://stackoverflow.com/a/20194533/786644

    downloadLink.innerHTML = ""; // Clear "Generating..."
    downloadLink.appendChild(a);

    // Delete object, eventually
    window.setTimeout(() => {
        window.URL.revokeObjectURL(url);
        downloadLink.innerHTML = "Download link expired."; // Remove expired link
    }, 60 * 1000);
}

function updateExportLeague(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0) {
        const categories = [{
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

        return {
            categories
        };
    }
}

function uiFirst() {
    ui.title("Export League");
}

module.exports = bbgmView.init({
    id: "exportLeague",
    post,
    runBefore: [updateExportLeague],
    uiFirst
});
