// @flow

import Promise from 'bluebird';
import g from '../globals';
import * as player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import NegotiationList from './views/NegotiationList';

function get() {
    if (g.phase !== g.PHASE.RESIGN_PLAYERS) {
        return {
            redirectUrl: helpers.leagueUrl(["negotiation", -1]),
        };
    }
}

async function updateNegotiationList() {
    // Get all free agents, filter array based on negotiations data, pass to player.filter, augment with contract data from negotiations
    let [negotiations, players] = await Promise.all([
        g.dbl.negotiations.getAll(),
        g.dbl.players.index('tid').getAll(g.PLAYER.FREE_AGENT).then(players2 => {
            return player.withStats(null, players2, {
                statsSeasons: [g.season],
                statsTid: g.userTid,
            });
        }),
    ]);

    // For Multi Team Mode, might have other team's negotiations going on
    negotiations = negotiations.filter(negotiation => negotiation.tid === g.userTid);
    const negotiationPids = negotiations.map(negotiation => negotiation.pid);

    players = players.filter(p => negotiationPids.includes(p.pid));
    players = player.filter(players, {
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
