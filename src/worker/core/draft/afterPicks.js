// @flow

import { PHASE, PLAYER } from "../../../common";
import { league, phase, player } from "..";
import { idb } from "../../db";
import { g, local, toUI, updatePlayMenu, updatePhase } from "../../util";
import type { Conditions } from "../../../common/types";

const afterPicks = async (draftOver: boolean, conditions?: Conditions) => {
    if (draftOver) {
        // Fantasy draft special case!
        if (g.phase === PHASE.FANTASY_DRAFT) {
            // Undrafted players become free agents
            const baseMoods = await player.genBaseMoods();
            const playersUndrafted = await idb.cache.players.indexGetAll(
                "playersByTid",
                PLAYER.UNDRAFTED,
            );
            for (const p of playersUndrafted) {
                player.addToFreeAgents(p, PHASE.FREE_AGENCY, baseMoods);
                await idb.cache.players.put(p);
            }

            // Swap back in normal draft class
            const players = await idb.cache.players.indexGetAll(
                "playersByTid",
                PLAYER.UNDRAFTED_FANTASY_TEMP,
            );
            for (const p of players) {
                p.tid = PLAYER.UNDRAFTED;
                await idb.cache.players.put(p);
            }

            await league.setGameAttributes({
                phase: g.nextPhase,
                nextPhase: null,
            });

            await updatePhase();
            await updatePlayMenu();
            await toUI(["realtimeUpdate", ["playerMovement"]]);

            local.fantasyDraftResults = [];
        } else {
            // Non-fantasy draft
            await phase.newPhase(PHASE.AFTER_DRAFT, conditions);
        }
    } else {
        await updatePlayMenu();
        await toUI(["realtimeUpdate", ["playerMovement"]]);
    }
};

export default afterPicks;
