// @flow

import g from '../../globals';
import * as player from '../core/player';
import {getCopy} from '../db';
import bbgmViewReact from '../../util/bbgmViewReact';
import * as helpers from '../../util/helpers';
import NegotiationList from '../../ui/views/NegotiationList';

function get() {
    if (g.phase !== g.PHASE.RESIGN_PLAYERS) {
        return {
            redirectUrl: helpers.leagueUrl(["negotiation", -1]),
        };
    }
}

async function updateNegotiationList() {
    let negotiations = await g.cache.getAll('negotiations');

    // For Multi Team Mode, might have other team's negotiations going on
    negotiations = negotiations.filter(negotiation => negotiation.tid === g.userTid);
    const negotiationPids = negotiations.map(negotiation => negotiation.pid);

    let players = await g.cache.indexGetAll('playersByTid', g.PLAYER.FREE_AGENT);
    players = players.filter(p => negotiationPids.includes(p.pid));
    players = await getCopy.playersPlus(players, {
        attrs: ["pid", "name", "age", "freeAgentMood", "injury", "watch"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["min", "pts", "trb", "ast", "per"],
        season: g.season,
        tid: g.userTid,
        showNoStats: true,
        fuzz: true,
    });

    for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < negotiations.length; j++) {
            if (players[i].pid === negotiations[j].pid) {
                players[i].contract = {};
                players[i].contract.amount = negotiations[j].player.amount / 1000;
                players[i].contract.exp = g.season + negotiations[j].player.years;
                break;
            }
        }

        players[i].mood = player.moodColorText(players[i]);
    }

    return {
        players,
    };
}

export default bbgmViewReact.init({
    id: "negotiationList",
    get,
    runBefore: [updateNegotiationList],
    Component: NegotiationList,
});
