// @flow

import { PHASE, g, helpers } from "../../../common";
import { player } from "../../core";
import getRookieSalaries from "./getRookieSalaries";
import { idb } from "../../db";
import { logEvent } from "../../util";
import type { PickRealized } from "../../../common/types";

/**
 * Select a player for the current drafting team.
 *
 * This can be called in response to the user clicking the "draft" button for a player, or by some other function like untilUserOrEnd.
 *
 * @memberOf core.draft
 * @param {object} pick Pick object, like from getOrder, that contains information like the team, round, etc.
 * @param {number} pid Integer player ID for the player to be drafted.
 * @return {Promise}
 */
const selectPlayer = async (pick: PickRealized, pid: number) => {
    const p = await idb.cache.players.get(pid);

    // Draft player
    p.tid = pick.tid;
    if (g.phase !== PHASE.FANTASY_DRAFT) {
        p.draft = {
            round: pick.round,
            pick: pick.pick,
            tid: pick.tid,
            year: g.season,
            originalTid: pick.originalTid,
            pot: p.ratings[0].pot,
            ovr: p.ratings[0].ovr,
            skills: p.ratings[0].skills,
        };
    }

    // Contract
    if (g.phase !== PHASE.FANTASY_DRAFT) {
        const rookieSalaries = getRookieSalaries();
        const i = pick.pick - 1 + g.numTeams * (pick.round - 1);
        const years = 4 - pick.round; // 2 years for 2nd round, 3 years for 1st round;
        player.setContract(
            p,
            {
                amount: rookieSalaries[i],
                exp: g.season + years,
            },
            true,
        );
    }

    // Add stats row if necessary (fantasy draft in ongoing season)
    if (g.phase === PHASE.FANTASY_DRAFT && g.nextPhase <= PHASE.PLAYOFFS) {
        player.addStatsRow(p, g.nextPhase === PHASE.PLAYOFFS);
    }

    await idb.cache.players.put(p);

    idb.cache.markDirtyIndexes("players");

    const draftName =
        g.phase === PHASE.FANTASY_DRAFT
            ? `${g.season} fantasy draft`
            : `${g.season} draft`;
    logEvent({
        type: "draft",
        text: `The <a href="${helpers.leagueUrl([
            "roster",
            g.teamAbbrevsCache[pick.tid],
            g.season,
        ])}">${
            g.teamNamesCache[pick.tid]
        }</a> selected <a href="${helpers.leagueUrl(["player", p.pid])}">${
            p.firstName
        } ${p.lastName}</a> with the ${helpers.ordinal(
            pick.pick + (pick.round - 1) * 30,
        )} pick in the <a href="${helpers.leagueUrl([
            "draft_summary",
            g.season,
        ])}">${draftName}</a>.`,
        showNotification: false,
        pids: [p.pid],
        tids: [p.tid],
    });
};

export default selectPlayer;
