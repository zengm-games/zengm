// @flow

import g from '../globals';
import * as player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import HallOfFame from './views/HallOfFame';

async function updatePlayers(inputs, updateEvents) {
    if (updateEvents.includes('dbChange') || updateEvents.includes('firstRun') || (updateEvents.includes('newPhase') && g.phase === g.PHASE.BEFORE_DRAFT)) {
        let players = await g.dbl.players.index('tid').getAll(g.PLAYER.RETIRED);
        players = players.filter(p => p.hof);
        players = await player.withStats(null, players, {statsSeasons: "all", statsPlayoffs: true});
        players = player.filter(players, {
            attrs: ["pid", "name", "draft", "retiredYear", "statsTids"],
            ratings: ["ovr", "pos"],
            stats: ["season", "abbrev", "gp", "min", "trb", "ast", "pts", "per", "ewa"],
            playoffs: true,
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
            players[i].legacy = {};
            for (let j = 0; j < players[i].stats.length; j++) {
                const rEWA = players[i].stats[j].ewa;
                const team = players[i].stats[j].abbrev;
                let pEWA = 0;
                for (let k = 0; k < players[i].statsPlayoffs.length; k++) {
                    if (players[i].stats[j].season === players[i].statsPlayoffs[k].season && team === players[i].statsPlayoffs[k].abbrev) {
                        pEWA = players[i].statsPlayoffs[k].ewa;
                        break;
                    }
                }
                if (rEWA + pEWA > bestEWA) {
                    bestEWA = rEWA + pEWA;
                    players[i].bestStats = players[i].stats[j];
                }
                if (players[i].legacy.hasOwnProperty(team)) {
                    players[i].legacy[team] += rEWA + pEWA;
                } else {
                    players[i].legacy[team] = rEWA + pEWA;
                }
            }

            const careerTeam = Object.keys(players[i].legacy).reduce((teamA, teamB) => (players[i].legacy[teamA] > players[i].legacy[teamB] ? teamA : teamB));
            players[i].legacy.abbrev = careerTeam;
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
