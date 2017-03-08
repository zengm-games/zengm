import {PHASE, PLAYER, g} from '../../common';
import {getCopy, idb} from '../db';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updatePlayers(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
): void | {[key: string]: any} {
    if ((inputs.season === g.season && (updateEvents.includes('gameSim') || updateEvents.includes('playerMovement'))) || inputs.season !== state.season) {
        let players;
        if (g.season === inputs.season && g.phase <= PHASE.PLAYOFFS) {
            players = await idb.cache.players.indexGetAll('playersByTid', [PLAYER.FREE_AGENT, Infinity]);
        } else {
            // If it's not this season, get all players, because retired players could apply to the selected season
            players = await getCopy.players({activeAndRetired: true});
        }
        players = await getCopy.playersPlus(players, {
            ratings: ["skills"],
            stats: ["gp", "gs", "min", "fg", "fga", "fgp", "tp", "tpa", "tpp", "ft", "fta", "ftp", "orb", "drb", "trb", "ast", "tov", "stl", "blk", "pf", "pts", "per"],
            season: inputs.season,
        });

        const statsAll = players.reduce((memo, p) => {
            for (const stat of Object.keys(p.stats)) {
                if (stat === 'playoffs') {
                    continue;
                }

                if (memo.hasOwnProperty(stat)) {
                    memo[stat].push(p.stats[stat]);
                } else {
                    memo[stat] = [p.stats[stat]];
                }
            }
            return memo;
        }, {});

        return {
            season: inputs.season,
            statsAll,
        };
    }
}

export default {
    runBefore: [updatePlayers],
};
