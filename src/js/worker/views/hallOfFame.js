// @flow

import g from '../../globals';
import {getCopy} from '../db';

async function updatePlayers(inputs, updateEvents) {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || (updateEvents.includes('newPhase') && g.phase === g.PHASE.BEFORE_DRAFT)) {
        let players = await getCopy.players({retired: true});
        players = players.filter(p => p.hof);
        players = await getCopy.playersPlus(players, {
            attrs: ["pid", "name", "draft", "retiredYear", "statsTids"],
            ratings: ["ovr", "pos"],
            stats: ["season", "abbrev", "gp", "min", "trb", "ast", "pts", "per", "ewa"],
        });

        // This stuff isn't in getCopy.playersPlus because it's only used here.
        for (const p of players) {
            p.peakOvr = 0;
            for (const pr of p.ratings) {
                if (pr.ovr > p.peakOvr) {
                    p.peakOvr = pr.ovr;
                }
            }

            p.bestStats = {
                gp: 0,
                min: 0,
                per: 0,
            };
            for (const ps of p.stats) {
                if (ps.gp * ps.min * ps.per > p.bestStats.gp * p.bestStats.min * p.bestStats.per) {
                    p.bestStats = ps;
                }
            }
        }

        return {
            players,
        };
    }
}

export default {
    runBefore: [updatePlayers],
};
