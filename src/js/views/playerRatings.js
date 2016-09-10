const g = require('../globals');
const player = require('../core/player');
const bbgmViewReact = require('../util/bbgmViewReact');
const helpers = require('../util/helpers');
const PlayerRatings = require('./views/PlayerRatings');

function get(req) {
    let abbrev;
    if (g.teamAbbrevsCache.indexOf(req.params.abbrev) >= 0) {
        abbrev = req.params.abbrev;
    } else if (req.params.abbrev && req.params.abbrev === 'watch') {
        abbrev = "watch";
    } else {
        abbrev = "all";
    }

    return {
        abbrev,
        season: helpers.validateSeason(req.params.season),
    };
}

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.indexOf("dbChange") >= 0 || (inputs.season === g.season && updateEvents.indexOf("playerMovement") >= 0) || (updateEvents.indexOf("newPhase") >= 0 && g.phase === g.PHASE.PRESEASON) || inputs.season !== state.season || inputs.abbrev !== state.abbrev) {
        let players = await g.dbl.players.getAll();
        players = await player.withStats(null, players, {
            statsSeasons: [inputs.season],
        });

        let tid = g.teamAbbrevsCache.indexOf(inputs.abbrev);
        if (tid < 0) { tid = undefined; } // Show all teams

        if (!tid && inputs.abbrev === "watch") {
            players = players.filter(p => p.watch && typeof p.watch !== "function");
        }

        players = player.filter(players, {
            attrs: ["pid", "name", "abbrev", "age", "born", "injury", "watch", "hof"],
            ratings: ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills", "pos"],
            stats: ["abbrev", "tid"],
            season: inputs.season,
            showNoStats: true, // If this is true, it makes the "tid" entry do nothing
            showRookies: true,
            fuzz: true,
        });

        // player.filter TID option doesn't work well enough (factoring in showNoStats and showRookies), so let's do it manually
        // For the current season, use the current abbrev (including FA), not the last stats abbrev
        // For other seasons, use the stats abbrev for filtering
        if (g.season === inputs.season) {
            if (tid !== undefined) {
                players = players.filter(p => p.abbrev === inputs.abbrev);
            }

            for (let i = 0; i < players.length; i++) {
                players[i].stats.abbrev = players[i].abbrev;
            }
        } else if (tid !== undefined) {
            players = players.filter(p => p.stats.abbrev === inputs.abbrev);
        }

        return {
            abbrev: inputs.abbrev,
            season: inputs.season,
            players,
        };
    }
}

module.exports = bbgmViewReact.init({
    id: "playerRatings",
    get,
    runBefore: [updatePlayers],
    Component: PlayerRatings,
});

