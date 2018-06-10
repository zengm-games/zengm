// @flow

import { PLAYER, g, helpers } from "../../common";
import type {
    DraftPick,
    GameProcessed,
    GameProcessedCompleted,
} from "../../common/types";

const formatCompletedGame = (game: GameProcessed): GameProcessedCompleted => {
    // If not specified, assume user's team is playing
    game.tid = game.tid !== undefined ? game.tid : g.userTid;

    // team0 and team1 are different than they are above! Here it refers to user and opponent, not home and away
    const team0 = {
        tid: game.tid,
        abbrev: g.teamAbbrevsCache[game.tid],
        region: g.teamRegionsCache[game.tid],
        name: g.teamNamesCache[game.tid],
        pts: game.pts,
    };
    const team1 = {
        tid: game.oppTid,
        abbrev: g.teamAbbrevsCache[game.oppTid],
        region: g.teamRegionsCache[game.oppTid],
        name: g.teamNamesCache[game.oppTid],
        pts: game.oppPts,
    };

    return {
        gid: game.gid,
        overtime: game.overtime,
        score: game.won
            ? `${team0.pts}-${team1.pts}`
            : `${team1.pts}-${team0.pts}`,
        teams: game.home ? [team1, team0] : [team0, team1],
        won: game.won,
    };
};

/**
 * Get the team abbreviation for a team ID.
 *
 * For instance, team ID 0 is Atlanta, which has an abbreviation of ATL.
 *
 * @memberOf util.helpers
 * @param {number|string} tid Integer team ID.
 * @return {string} Abbreviation
 */
const getAbbrev = (tid: number | string): string => {
    tid = parseInt(tid, 10);

    if (tid === PLAYER.FREE_AGENT) {
        return "FA";
    }
    if (tid < 0 || Number.isNaN(tid)) {
        // Draft prospect or retired
        return "";
    }
    if (tid >= g.teamAbbrevsCache.length) {
        tid = g.userTid;
    }

    return g.teamAbbrevsCache[tid];
};

const pickDesc = (dp: DraftPick): string => {
    const season = dp.season === "fantasy" ? "Fantasy draft" : dp.season;
    let desc = `${season} ${helpers.ordinal(dp.round)} round pick`;

    const extras = [];
    if (dp.pick > 0) {
        extras.push(helpers.ordinal((dp.round - 1) * g.numTeams + dp.pick));
    }
    if (dp.tid !== dp.originalTid) {
        extras.push(`from ${g.teamAbbrevsCache[dp.originalTid]}`);
    }

    if (extras.length > 0) {
        desc += ` (${extras.join(", ")})`;
    }

    return desc;
};

export default {
    formatCompletedGame,
    getAbbrev,
    pickDesc,
};
