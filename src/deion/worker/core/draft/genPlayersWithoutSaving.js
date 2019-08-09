// @flow

import range from "lodash/range";
import { PLAYER } from "../../../common";
import { player } from "..";
import { g, random } from "../../util";
import type {
    MinimalPlayerRatings,
    PlayerWithoutPid,
} from "../../../common/types";

const genPlayersWithoutSaving = (
    draftYear: number,
    scoutingRank: number,
    numPlayers?: number,
): PlayerWithoutPid<MinimalPlayerRatings>[] => {
    if (numPlayers === null || numPlayers === undefined) {
        numPlayers = Math.round((g.numDraftRounds * g.numTeams * 7) / 6); // 70 for basketball 2 round draft
    }
    if (numPlayers < 0) {
        numPlayers = 0;
    }

    const baseAge = 19 - (draftYear - g.season);

    let remaining = range(numPlayers).map(() => {
        const p = player.generate(
            PLAYER.UNDRAFTED,
            baseAge,
            draftYear,
            false,
            scoutingRank,
        );

        // Just for ovr/pot
        player.develop(p, 0);

        // Add a fudge factor, used when sorting below to add a little randomness to players entering draft. This may
        // seem quite large, but empirically it seems to work well.
        p.fudgeFactor = random.randInt(-50, 50);

        return p;
    });

    // Do one season at a time, keeping the lowest pot players in college for another season
    let enteringDraft = [];
    for (let i = 0; i < 4; i++) {
        let cutoff = 0;

        // For football, only juniors and seniors
        if (process.env.SPORT === "basketball" || i >= 2) {
            // Top 50% of players remaining enter draft, except in last year when all do
            cutoff =
                i === 3 ? remaining.length : Math.round(0.5 * remaining.length);
        }

        remaining.sort(
            (a, b) =>
                b.ratings[0].pot +
                b.fudgeFactor -
                (a.ratings[0].pot + a.fudgeFactor),
        );
        enteringDraft = enteringDraft.concat(remaining.slice(0, cutoff));
        remaining = remaining.slice(cutoff);

        // Each player staying in college, develop 1 year more
        for (const p of remaining) {
            player.develop(p, 1, true);
        }
    }

    // Small chance of making top 4 players (in 70 player draft) special - on average, one per draft class
    const numSpecialPlayerChances = Math.round((4 / 70) * numPlayers);
    for (let i = 0; i < numSpecialPlayerChances; i++) {
        if (Math.random() < 1 / numSpecialPlayerChances) {
            const p = enteringDraft[i];
            player.bonus(p);
            player.develop(p, 0); // Recalculate ovr/pot
        }
    }

    for (const p of enteringDraft) {
        delete p.fudgeFactor;

        // Update player values after ratings changes
        player.updateValues(p);
    }

    return enteringDraft;
};

export default genPlayersWithoutSaving;
