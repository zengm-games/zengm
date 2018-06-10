// @flow

import { PLAYER, g } from "../../../common";
import { contractNegotiation, draft, league } from "../../core";
import { idb } from "../../db";
import { helpers, local } from "../../util";
import type { Conditions } from "../../../common/types";

const newPhaseFantasyDraft = async (
    conditions: Conditions,
    position: number,
) => {
    local.fantasyDraftResults = [];

    await contractNegotiation.cancelAll();
    await draft.genOrderFantasy(position);
    await league.setGameAttributes({ nextPhase: g.phase });
    await idb.cache.releasedPlayers.clear();

    // Protect draft prospects from being included in this
    const playersUndrafted = await idb.cache.players.indexGetAll(
        "playersByTid",
        PLAYER.UNDRAFTED,
    );
    for (const p of playersUndrafted) {
        p.tid = PLAYER.UNDRAFTED_FANTASY_TEMP;
        await idb.cache.players.put(p);
    }

    // Make all players draftable
    const players = await idb.cache.players.indexGetAll("playersByTid", [
        PLAYER.FREE_AGENT,
        Infinity,
    ]);
    for (const p of players) {
        p.tid = PLAYER.UNDRAFTED;
        await idb.cache.players.put(p);
    }

    // Return traded draft picks to original teams
    const draftPicks = await idb.cache.draftPicks.getAll();
    for (const dp of draftPicks) {
        if (dp.tid !== dp.originalTid) {
            dp.tid = dp.originalTid;
            await idb.cache.draftPicks.put(dp);
        }
    }

    return [helpers.leagueUrl(["draft"]), ["playerMovement"]];
};

export default newPhaseFantasyDraft;
