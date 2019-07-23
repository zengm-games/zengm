// @flow

import { PHASE, PLAYER } from "../../common";
import type { GetOutput, UpdateEvents } from "../../common/types";
import { draft } from "../core";
import { idb } from "../db";
import { g, local } from "../util";

async function updateDraft(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } {
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("playerMovement")
    ) {
        const fantasyDraft = g.phase === PHASE.FANTASY_DRAFT;

        let stats;
        let undrafted;
        if (fantasyDraft) {
            stats =
                process.env.SPORT === "basketball"
                    ? ["per", "ewa"]
                    : ["gp", "keyStats", "av"];

            undrafted = await idb.cache.players.indexGetAll(
                "playersByTid",
                PLAYER.UNDRAFTED,
            );
        } else {
            stats = [];
            undrafted = (await idb.cache.players.indexGetAll(
                "playersByDraftYearRetiredYear",
                [[g.season], [g.season, Infinity]],
            )).filter(p => p.tid === PLAYER.UNDRAFTED);

            // DIRTY QUICK FIX FOR v10 db upgrade bug - eventually remove
            // This isn't just for v10 db upgrade! Needed the same fix for http://www.reddit.com/r/BasketballGM/comments/2tf5ya/draft_bug/cnz58m2?context=3 - draft class not always generated with the correct seasons
            for (const p of undrafted) {
                const season = p.ratings[0].season;
                if (season !== g.season && g.phase === PHASE.DRAFT) {
                    console.log("FIXING MESSED UP DRAFT CLASS");
                    console.log(season);
                    p.ratings[0].season = g.season;
                    await idb.cache.players.put(p);
                }
            }
        }

        undrafted.sort((a, b) => b.valueFuzz - a.valueFuzz);
        undrafted = await idb.getCopies.playersPlus(undrafted, {
            attrs: ["pid", "name", "age", "injury", "contract", "watch"],
            ratings: ["ovr", "pot", "skills", "pos"],
            stats,
            season: g.season,
            showNoStats: true,
            showRookies: true,
            fuzz: true,
        });

        let drafted;
        if (fantasyDraft) {
            drafted = local.fantasyDraftResults;
        } else {
            drafted = await idb.cache.players.indexGetAll("playersByTid", [
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
        }
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

        // DIRTY QUICK FIX FOR sometimes there are twice as many draft picks as needed, and one set has all pick 0
        if (!fantasyDraft && draftPicks.length > 2 * g.numTeams) {
            const draftPicks2 = draftPicks.filter(dp => dp.pick > 0);
            if (draftPicks2.length === 2 * g.numTeams) {
                const toDelete = draftPicks.filter(dp => dp.pick === 0);
                for (const dp of toDelete) {
                    await idb.cache.draftPicks.delete(dp.dpid);
                }
                draftPicks = draftPicks2;
            }
        }

        // DIRTY QUICK FIX FOR https://github.com/dumbmatter/basketball-gm/issues/246
        // Not sure why this is needed! Maybe related to lottery running before the phase change?
        if (draftPicks.some(dp => dp.pick === 0)) {
            await draft.genOrder();
            draftPicks = await draft.getOrder();
        }

        for (const dp of draftPicks) {
            drafted.push({
                draft: dp,
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
            draftType: g.draftType,
            drafted,
            fantasyDraft,
            stats,
            undrafted,
            userTids: g.userTids,
        };
    }
}

export default {
    runBefore: [updateDraft],
};
