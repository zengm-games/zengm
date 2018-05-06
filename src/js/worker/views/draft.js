// @flow

import { PHASE, PLAYER, g } from "../../common";
import { draft } from "../core";
import { idb } from "../db";

async function updateDraft(): void | { [key: string]: any } {
    let undrafted = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED,
    );

    // DIRTY QUICK FIX FOR v10 db upgrade bug - eventually remove
    // This isn't just for v10 db upgrade! Needed the same fix for http://www.reddit.com/r/BasketballGM/comments/2tf5ya/draft_bug/cnz58m2?context=3 - draft class not always generated with the correct seasons
    for (const p of undrafted) {
        const season = p.ratings[0].season;
        if (season !== g.season && g.phase === PHASE.DRAFT) {
            console.log("FIXING FUCKED UP DRAFT CLASS");
            console.log(season);
            p.ratings[0].season = g.season;
            p.draft.year = g.season;
            await idb.cache.players.put(p);
        }
    }

    undrafted.sort((a, b) => b.valueFuzz - a.valueFuzz);
    undrafted = await idb.getCopies.playersPlus(undrafted, {
        attrs: ["pid", "name", "age", "injury", "contract", "watch"],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["per", "ewa"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    let drafted = await idb.cache.players.indexGetAll("playersByTid", [
        0,
        Infinity,
    ]);
    drafted = drafted.filter(p => p.draft.year === g.season);
    drafted.sort(
        (a, b) =>
            100 * a.draft.round +
            a.draft.pick -
            (100 * b.draft.round + b.draft.pick),
    );
    drafted = await idb.getCopies.playersPlus(drafted, {
        attrs: [
            "pid",
            "tid",
            "name",
            "age",
            "draft",
            "injury",
            "contract",
            "watch",
        ],
        ratings: ["ovr", "pot", "skills", "pos"],
        stats: ["per", "ewa"],
        season: g.season,
        showRookies: true,
        fuzz: true,
    });

    let draftPicks = await draft.getOrder();

    // DIRTY QUICK FIX FOR https://github.com/dumbmatter/basketball-gm/issues/246
    // Not sure why this is needed! Maybe related to lottery running before the phase change?
    if (draftPicks.some(dp => dp.pick === 0)) {
        await draft.genOrder();
        draftPicks = await draft.getOrder();
    }

    for (const dp of draftPicks) {
        drafted.push({
            draft: {
                tid: dp.tid,
                originalTid: dp.originalTid,
                round: dp.round,
                pick: dp.pick,
            },
            pid: -1,
        });
    }

    if (drafted.length === 0) {
        console.log("drafted:", drafted);
        console.log("draftPicks:", draftPicks);
        throw new Error(
            "drafted.length should always be 60, combo of drafted players and picks. But now it's 0. Why?",
        );
    }

    return {
        undrafted,
        drafted,
        fantasyDraft: g.phase === PHASE.FANTASY_DRAFT,
        userTids: g.userTids,
    };
}

export default {
    runBefore: [updateDraft],
};
