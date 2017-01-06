// @flow

import Promise from 'bluebird';
import g from '../globals';
import * as draft from '../core/draft';
import * as player from '../core/player';
import bbgmViewReact from '../util/bbgmViewReact';
import * as helpers from '../util/helpers';
import Draft from './views/Draft';

function get() {
    if (g.phase !== g.PHASE.DRAFT && g.phase !== g.PHASE.FANTASY_DRAFT) {
        return {
            redirectUrl: helpers.leagueUrl(["draft_summary"]),
        };
    }
}

async function updateDraft() {
    // DIRTY QUICK FIX FOR v10 db upgrade bug - eventually remove
    // This isn't just for v10 db upgrade! Needed the same fix for http://www.reddit.com/r/BasketballGM/comments/2tf5ya/draft_bug/cnz58m2?context=3 - draft class not always generated with the correct seasons
    await g.dbl.tx("players", "readwrite", async tx => {
        const p = await tx.players.index('tid').get(g.PLAYER.UNDRAFTED);
        const season = p.ratings[0].season;
        if (season !== g.season && g.phase === g.PHASE.DRAFT) {
            console.log("FIXING FUCKED UP DRAFT CLASS");
            console.log(season);
            await tx.players.index('tid').iterate(g.PLAYER.UNDRAFTED, p2 => {
                p2.ratings[0].season = g.season;
                p2.draft.year = g.season;
                return p2;
            });
        }
    });

    let [undrafted, players] = await Promise.all([
        g.dbl.players.index('tid').getAll(g.PLAYER.UNDRAFTED).then(players2 => {
            return player.withStats(null, players2, {
                statsSeasons: [g.season],
            });
        }),
        g.dbl.players.index('draft.year').getAll(g.season).then(players2 => {
            return player.withStats(null, players2, {
                statsSeasons: [g.season],
            });
        }),
    ]);

    undrafted.sort((a, b) => b.valueFuzz - a.valueFuzz);
    undrafted = player.filter(undrafted, {
        attrs: ["pid", "name", "age", "injury", "contract", "watch"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["per", "ewa"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    players = player.filter(players, {
        attrs: ["pid", "tid", "name", "age", "draft", "injury", "contract", "watch"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["per", "ewa"],
        season: g.season,
        showRookies: true,
        fuzz: true,
    });

    const drafted = [];
    for (let i = 0; i < players.length; i++) {
        if (players[i].tid >= 0) {
            drafted.push(players[i]);
        }
    }
    drafted.sort((a, b) => (100 * a.draft.round + a.draft.pick) - (100 * b.draft.round + b.draft.pick));

    // Start draft if a pick has already been made (then it's already started)
    let started = drafted.length > 0;

    const draftOrder = await draft.getOrder();
    for (let i = 0; i < draftOrder.length; i++) {
        const slot = draftOrder[i];
        drafted.push({
            draft: {
                tid: slot.tid,
                originalTid: slot.originalTid,
                round: slot.round,
                pick: slot.pick,
            },
            pid: -1,
        });
    }

    // ...or start draft if the user has the first pick (in which case starting it has no effect, might as well do it automatically)
    started = started || g.userTids.indexOf(drafted[0].draft.tid) >= 0;

    return {
        undrafted,
        drafted,
        started,
        fantasyDraft: g.phase === g.PHASE.FANTASY_DRAFT,
        userTids: g.userTids,
    };
}

export default bbgmViewReact.init({
    id: "draft",
    get,
    runBefore: [updateDraft],
    Component: Draft,
});
