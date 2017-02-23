// @flow

import g from '../globals';
import * as freeAgents from '../core/freeAgents';
import {getCopy} from '../db';
import bbgmViewReact from '../util/bbgmViewReact';
import WatchList from './views/WatchList';

function get(ctx) {
    return {
        statType: ctx.params.statType !== undefined ? ctx.params.statType : "perGame",
        playoffs: ctx.params.playoffs !== undefined ? ctx.params.playoffs : "regularSeason",
    };
}

async function updatePlayers(inputs, updateEvents, state) {
    if (updateEvents.includes('dbChange') || updateEvents.includes('clearWatchList') || updateEvents.includes('gameSim') || updateEvents.includes('playerMovement') || inputs.statType !== state.statType || inputs.playoffs !== state.playoffs) {
        let players = await g.dbl.players.getAll();
        players = players.filter(p => p.watch && typeof p.watch !== "function"); // In Firefox, objects have a "watch" function
        players = await getCopy.playersPlus(players, {
            attrs: ["pid", "name", "age", "injury", "tid", "abbrev", "watch", "contract", "freeAgentMood", "draft"],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats: ["gp", "min", "fgp", "tpp", "ftp", "trb", "ast", "tov", "stl", "blk", "pts", "per", "ewa"],
            season: g.season,
            statType: inputs.statType,
            playoffs: inputs.playoffs === "playoffs",
            regularSeason: inputs.playoffs !== "playoffs",
            fuzz: true,
            showNoStats: true,
            showRookies: true,
            showRetired: true,
            oldStats: true,
        });

        // Add mood to free agent contracts
        for (let i = 0; i < players.length; i++) {
            if (players[i].tid === g.PLAYER.FREE_AGENT) {
                players[i].contract.amount = freeAgents.amountWithMood(players[i].contract.amount, players[i].freeAgentMood[g.userTid]);
            }
        }

        return {
            players,
            playoffs: inputs.playoffs,
            statType: inputs.statType,
        };
    }
}

export default bbgmViewReact.init({
    id: "watchList",
    get,
    runBefore: [updatePlayers],
    Component: WatchList,
});
