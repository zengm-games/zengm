import g from '../../globals';
import {getCopy} from '../db';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import PlayerRatings from '../../ui/views/PlayerRatings';

function get(ctx) {
    let abbrev;
    if (g.teamAbbrevsCache.includes(ctx.params.abbrev)) {
        abbrev = ctx.params.abbrev;
    } else if (ctx.params.abbrev && ctx.params.abbrev === 'watch') {
        abbrev = "watch";
    } else {
        abbrev = "all";
    }

    return {
        abbrev,
        season: helpers.validateSeason(ctx.params.season),
    };
}

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || (inputs.season === g.season && updateEvents.includes('playerMovement')) || (updateEvents.includes('newPhase') && g.phase === g.PHASE.PRESEASON) || inputs.season !== state.season || inputs.abbrev !== state.abbrev) {
        let players;
        if (g.season === inputs.season && g.phase <= g.PHASE.PLAYOFFS) {
            players = await g.cache.indexGetAll('playersByTid', [g.PLAYER.FREE_AGENT, Infinity]);
        } else {
            // If it's not this season, get all players, because retired players could apply to the selected season
            players = await getCopy.players({activeAndRetired: true});
        }

        let tid = g.teamAbbrevsCache.indexOf(inputs.abbrev);
        if (tid < 0) { tid = undefined; } // Show all teams

        if (!tid && inputs.abbrev === "watch") {
            players = players.filter(p => p.watch && typeof p.watch !== "function");
        }

        players = await getCopy.playersPlus(players, {
            attrs: ["pid", "name", "abbrev", "age", "born", "injury", "watch", "hof"],
            ratings: ["ovr", "pot", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb", "skills", "pos"],
            stats: ["abbrev", "tid"],
            season: inputs.season,
            showNoStats: true, // If this is true, it makes the "tid" entry do nothing
            showRookies: true,
            fuzz: true,
        });

        // getCopy.playersPlus `tid` option doesn't work well enough (factoring in showNoStats and showRookies), so let's do it manually
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

export default bbgmViewReact.init({
    id: "playerRatings",
    get,
    runBefore: [updatePlayers],
    Component: PlayerRatings,
});

