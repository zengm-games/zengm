// @flow

import g from '../globals';
import * as player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import HallOfFame from './views/HallOfFame';

async function updatePlayers(inputs, updateEvents) {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || (updateEvents.includes('newPhase') && g.phase === g.PHASE.BEFORE_DRAFT)) {
        let players = await g.dbl.players.index('tid').getAll(g.PLAYER.RETIRED);
        players = players.filter(p => p.hof);
        players = await player.withStats(null, players, {statsSeasons: "all"});
        players = player.filter(players, {
            attrs: ["pid", "name", "draft", "retiredYear", "statsTids"],
            ratings: ["ovr", "pos"],
            stats: ["season", "abbrev", "tid", "gp", "min", "trb", "ast", "pts", "per", "ewa"],
        });

        // This stuff isn't in player.filter because it's only used here.
        for (let i = 0; i < players.length; i++) {
            players[i].peakOvr = 0;
            for (let j = 0; j < players[i].ratings.length; j++) {
                if (players[i].ratings[j].ovr > players[i].peakOvr) {
                    players[i].peakOvr = players[i].ratings[j].ovr;
                }
            }

            players[i].bestStats = {};
            let bestEWA = 0;
            players[i].teamSums = {};
            for (let j = 0; j < players[i].stats.length; j++) {
                const tid = players[i].stats[j].tid;
                const EWA = players[i].stats[j].ewa;
                if (EWA > bestEWA) {
                    players[i].bestStats = players[i].stats[j];
                    bestEWA = EWA;
                }
                if (players[i].teamSums.hasOwnProperty(tid)) {
                    players[i].teamSums[tid] += EWA;
                } else {
                    players[i].teamSums[tid] = EWA;
                }
            }
            players[i].legacyTid = parseInt(Object.keys(players[i].teamSums).reduce((teamA, teamB) => (players[i].teamSums[teamA] > players[i].teamSums[teamB] ? teamA : teamB)), 10);
        }

        return {
            players,
        };
    }
}

export default bbgmViewReact.init({
    id: "hallOfFame",
    runBefore: [updatePlayers],
    Component: HallOfFame,
});
