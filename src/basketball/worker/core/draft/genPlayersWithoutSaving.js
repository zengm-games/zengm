// @flow

import range from "lodash/range";
import { PLAYER } from "../../../common";
import { player } from "..";
import { g, random } from "../../util";
import type { PlayerWithoutPid } from "../../../../deion/common/types";
import type { PlayerRatings } from "../../../common/types";

const genPlayersWithoutSaving = (
    tid: number,
    scoutingRank: number,
    numPlayers?: number,
    newLeague?: boolean,
): {
    draftYear: number,
    players: PlayerWithoutPid<PlayerRatings>[],
} => {
    if (numPlayers === null || numPlayers === undefined) {
        numPlayers = Math.round((70 * g.numTeams) / 30); // 70 scaled by number of teams
    }

    let draftYear = g.season;

    let baseAge = 19;
    if (newLeague) {
        // New league, creating players for draft in same season and following 2 seasons
        if (tid === PLAYER.UNDRAFTED_2) {
            baseAge -= 1;
            draftYear += 1;
        } else if (tid === PLAYER.UNDRAFTED_3) {
            baseAge -= 2;
            draftYear += 2;
        }
    } else if (tid === PLAYER.UNDRAFTED_3) {
        // Player being generated after draft ends, for draft in 3 years
        baseAge -= 3;
        draftYear += 3;
    }

    let remaining = range(numPlayers).map(() => {
        const p = player.generate(tid, baseAge, draftYear, false, scoutingRank);

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
        // Top 50% of players remaining enter draft, except in last year when all do
        const cutoff =
            i === 3 ? remaining.length : Math.round(0.5 * remaining.length);

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

    return {
        draftYear,
        players: enteringDraft,
    };
};

export default genPlayersWithoutSaving;
