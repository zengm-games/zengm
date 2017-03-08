import {PHASE, PLAYER, g} from '../../common';
import {getCopy, idb} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updatePlayers(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if ((inputs.season === g.season && updateEvents.includes('playerMovement')) || (updateEvents.includes('newPhase') && g.phase === PHASE.PRESEASON) || inputs.season !== state.season || inputs.abbrev !== state.abbrev) {
        let players;
        if (g.season === inputs.season && g.phase <= PHASE.PLAYOFFS) {
            players = await idb.cache.players.indexGetAll('playersByTid', [PLAYER.FREE_AGENT, Infinity]);
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

export default {
    runBefore: [updatePlayers],
};
