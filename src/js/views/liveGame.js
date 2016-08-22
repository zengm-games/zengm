const g = require('../globals');
const game = require('../core/game');
const $ = require('jquery');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const LiveGame = require('./views/LiveGame');

function get(req) {
    if (req.raw.playByPlay !== undefined) {
        return {
            gidPlayByPlay: req.raw.gidPlayByPlay,
            playByPlay: req.raw.playByPlay,
        };
    }
}

function post(req) {
    const gid = parseInt(req.params.gid, 10);

    // Start 1 day of game simulation
    // Prevent any redirects, somehow
    // Get play by play for gid through raw of ui.realtimeUpdate
    // gameSim with playByPlay in raw leads to display of play by play in updatePlayByPlay
    game.play(1, true, gid);
}

async function updatePlayByPlay(inputs) {
    if (inputs.playByPlay !== undefined && inputs.playByPlay.length > 0) {
        const boxScore = await g.dbl.games.get(inputs.gidPlayByPlay);

        // Stats to set to 0
        const resetStats = ["min", "fg", "fga", "tp", "tpa", "ft", "fta", "orb", "trb", "ast", "tov", "stl", "blk", "ba", "pf", "pts", "pm"];

        boxScore.overtime = "";
        boxScore.quarter = "1st quarter";
        boxScore.time = "12:00";
        boxScore.gameOver = false;
        for (let i = 0; i < boxScore.teams.length; i++) {
            // Team metadata
            boxScore.teams[i].abbrev = g.teamAbbrevsCache[boxScore.teams[i].tid];
            boxScore.teams[i].region = g.teamRegionsCache[boxScore.teams[i].tid];
            boxScore.teams[i].name = g.teamNamesCache[boxScore.teams[i].tid];

            boxScore.teams[i].ptsQtrs = [0];
            for (let s = 0; s < resetStats.length; s++) {
                boxScore.teams[i][resetStats[s]] = 0;
            }
            for (let j = 0; j < boxScore.teams[i].players.length; j++) {
                // Fix for players who were hurt this game - don't show right away!
                if (boxScore.teams[i].players[j].injury.type !== "Healthy" && boxScore.teams[i].players[j].min > 0) {
                    boxScore.teams[i].players[j].injury = {type: "Healthy", gamesRemaining: 0};
                }

                for (let s = 0; s < resetStats.length; s++) {
                    boxScore.teams[i].players[j][resetStats[s]] = 0;
                }

                if (j < 5) {
                    boxScore.teams[i].players[j].inGame = true;
                } else {
                    boxScore.teams[i].players[j].inGame = false;
                }
            }
        }

        return {
            initialBoxScore: boxScore,
            events: inputs.playByPlay,
        };
    }

/*    // If no game is loaded by this point (either by this GET or a prior one), leave
    if (vm.boxScore.gid() < 0) {
        return {
            redirectUrl: helpers.leagueUrl(["live"]),
        };
    }*/
}

function uiFirst() {
    // Keep plays list always visible
    $("#affixPlayByPlay").affix({
        offset: {
            top: 80,
        },
    });

    // Keep height of plays list equal to window
    const playByPlayList = document.getElementById("playByPlayList");
    playByPlayList.style.height = `${window.innerHeight - 114}px`;
    window.addEventListener("resize", () => {
        playByPlayList.style.height = `${window.innerHeight - 114}px`;
    });
}

module.exports = bbgmViewReact.init({
    id: "liveGame",
    get,
    runBefore: [updatePlayByPlay],
    Component: LiveGame,
});
