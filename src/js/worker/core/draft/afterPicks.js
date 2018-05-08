// @flow

import { PHASE, PLAYER, g } from "../../../common";
import { league, phase, player } from "../../core";
import { idb } from "../../db";
import { toUI, updatePlayMenu, updatePhase } from "../../util";
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
                await player.addToFreeAgents(p, PHASE.FREE_AGENCY, baseMoods);
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
        } else {
            // Non-fantasy draft
            await phase.newPhase(PHASE.AFTER_DRAFT, conditions);
        }
    } else {
        await toUI(["realtimeUpdate", ["playerMovement"]]);
    }
};

export default afterPicks;
