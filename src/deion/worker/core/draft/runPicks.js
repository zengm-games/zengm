// @flow

import { PHASE, PLAYER } from "../../../common";
import afterPicks from "./afterPicks";
import getOrder from "./getOrder";
import selectPlayer from "./selectPlayer";
import { idb } from "../../db";
import { g, helpers, local, lock, random } from "../../util";
import type { Conditions } from "../../../common/types";

/**
 * Simulate draft picks until it's the user's turn or the draft is over.
 *
 * This could be made faster by passing a transaction around, so all the writes for all the picks are done in one transaction. But when calling selectPlayer elsewhere (i.e. in testing or in response to the user's pick), it needs to be sure that the transaction is complete before continuing. So I would need to create a special case there to account for it. Given that this isn't really *that* slow now, that probably isn't worth the complexity. Although... team.rosterAutoSort does precisely this... so maybe it would be a good idea...
 *
 * @memberOf core.draft
 * @param {boolean} onlyOne If true, only do one pick. If false, do all picks until the user's next pick. Default false.
 * @return {Promise.[Array.<Object>, Array.<number>]} Resolves to an array of player IDs who were drafted during this function call, in order.
 */
const runPicks = async (onlyOne: boolean, conditions?: Conditions) => {
    if (lock.get("drafting")) {
        return [];
    }

    lock.set("drafting", true);

    const pids = [];

    const draftPicks = await getOrder();

    let playersAll;
    if (g.phase === PHASE.FANTASY_DRAFT) {
        playersAll = await idb.cache.players.indexGetAll(
            "playersByTid",
            PLAYER.UNDRAFTED,
        );
    } else {
        playersAll = (await idb.cache.players.indexGetAll(
            "playersByDraftYearRetiredYear",
            [[g.season], [g.season, Infinity]],
        )).filter(p => p.tid === PLAYER.UNDRAFTED);
    }

    playersAll.sort((a, b) => b.value - a.value);

    // Called after either the draft is over or it's the user's pick
    const afterDoneAuto = async () => {
        // Is draft over?
        await afterPicks(draftPicks.length === 0, conditions);

        lock.set("drafting", false);

        return pids;
    };

    // This will actually draft "untilUserOrEnd"
    const autoSelectPlayer = async () => {
        if (draftPicks.length > 0) {
            const dp = draftPicks[0];
            if (g.userTids.includes(dp.tid) && local.autoPlaySeasons === 0) {
                return afterDoneAuto();
            }
            draftPicks.shift();

            const selection = helpers.bound(
                Math.floor(Math.abs(random.realGauss(0, 1))),
                0,
                playersAll.length - 1,
            ); // 0=best prospect, 1=next best prospect, etc.
            const pid = playersAll[selection].pid;
            await selectPlayer(dp, pid);
            pids.push(pid);
            playersAll.splice(selection, 1); // Delete from the list of undrafted players

            if (!onlyOne) {
                return autoSelectPlayer();
            }
        }

        return afterDoneAuto();
    };

    return autoSelectPlayer();
};

export default runPicks;
