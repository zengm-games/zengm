// @flow

import { PHASE, PLAYER, g } from "../../../common";
import { league, phase, player } from "../../core";
import getOrder from "./getOrder";
import selectPlayer from "./selectPlayer";
import { idb } from "../../db";
import { local, random, updatePlayMenu, updatePhase } from "../../util";
import type { Conditions } from "../../../common/types";

/**
 * Simulate draft picks until it's the user's turn or the draft is over.
 *
 * This could be made faster by passing a transaction around, so all the writes for all the picks are done in one transaction. But when calling selectPlayer elsewhere (i.e. in testing or in response to the user's pick), it needs to be sure that the transaction is complete before continuing. So I would need to create a special case there to account for it. Given that this isn't really *that* slow now, that probably isn't worth the complexity. Although... team.rosterAutoSort does precisely this... so maybe it would be a good idea...
 *
 * @memberOf core.draft
 * @return {Promise.[Array.<Object>, Array.<number>]} Resolves to array. First argument is the list of draft picks (from getOrder). Second argument is a list of player IDs who were drafted during this function call, in order.
 */
const untilUserOrEnd = async (conditions: Conditions) => {
    const pids = [];

    const [playersAll, draftPicks] = await Promise.all([
        idb.cache.players.indexGetAll("playersByTid", PLAYER.UNDRAFTED),
        getOrder(),
    ]);

    playersAll.sort((a, b) => b.value - a.value);

    // Called after either the draft is over or it's the user's pick
    const afterDoneAuto = async () => {
        // Is draft over?
        if (draftPicks.length === 0) {
            // Fantasy draft special case!
            if (g.phase === PHASE.FANTASY_DRAFT) {
                // Undrafted players become free agents
                const baseMoods = await player.genBaseMoods();
                const playersUndrafted = await idb.cache.players.indexGetAll(
                    "playersByTid",
                    PLAYER.UNDRAFTED,
                );
                for (const p of playersUndrafted) {
                    await player.addToFreeAgents(
                        p,
                        PHASE.FREE_AGENCY,
                        baseMoods,
                    );
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
            } else {
                // Non-fantasy draft
                await phase.newPhase(PHASE.AFTER_DRAFT, conditions);
            }
        }

        // Draft is not over, so continue
        return pids;
    };

    // This will actually draft "untilUserOrEnd"
    const autoSelectPlayer = async () => {
        if (draftPicks.length > 0) {
            const dp = draftPicks.shift();

            if (g.userTids.includes(dp.tid) && local.autoPlaySeasons === 0) {
                return afterDoneAuto();
            }

            const selection = Math.floor(Math.abs(random.realGauss(0, 1))); // 0=best prospect, 1=next best prospect, etc.
            const pid = playersAll[selection].pid;
            await selectPlayer(dp, pid);
            pids.push(pid);
            playersAll.splice(selection, 1); // Delete from the list of undrafted players

            return autoSelectPlayer();
        }

        return afterDoneAuto();
    };

    return autoSelectPlayer();
};

export default untilUserOrEnd;
