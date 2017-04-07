// @flow

import {PLAYER, g} from '../../common';
import {player} from '../core';
import {idb} from '../db';

async function updateNegotiationList(): void | {[key: string]: any} {
    let negotiations = await idb.cache.negotiations.getAll();

    // For Multi Team Mode, might have other team's negotiations going on
    negotiations = negotiations.filter(negotiation => negotiation.tid === g.userTid);
    const negotiationPids = negotiations.map(negotiation => negotiation.pid);

    let players = await idb.cache.players.indexGetAll('playersByTid', PLAYER.FREE_AGENT);
    players = players.filter(p => negotiationPids.includes(p.pid));
    players = await idb.getCopies.playersPlus(players, {
        attrs: ["pid", "name", "age", "freeAgentMood", "injury", "watch"],
        ratings: ["ovr", "pot", "skills", "pos", "hgt", "stre", "spd", "jmp", "endu", "ins", "dnk", "ft", "fg", "tp", "blk", "stl", "drb", "pss", "reb"],
        stats: ["min", "pts", "trb", "ast", "per", "fg", "fga", "tp", "tpa", "ft", "fta"],
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

export default {
    runBefore: [updateNegotiationList],
};
