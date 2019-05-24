// @flow

import { PHASE } from "../../../common";
import { player } from "..";
import getRookieSalaries from "./getRookieSalaries";
import { idb } from "../../db";
import { g, helpers, local, logEvent, overrides } from "../../util";
import type { DraftPick } from "../../../common/types";

/**
 * Select a player for the current drafting team.
 *
 * This can be called in response to the user clicking the "draft" button for a player, or by some other function like untilUserOrEnd.
 *
 * @memberOf core.draft
 * @param {object} dp Pick object, like from getOrder, that contains information like the team, round, etc.
 * @param {number} pid Integer player ID for the player to be drafted.
 * @return {Promise}
 */
const selectPlayer = async (dp: DraftPick, pid: number) => {
    if (dp.pick <= 0) {
        throw new Error(`Invalid draft pick number "${dp.pick}"`);
    }

    const p = await idb.cache.players.get(pid);

    // Draft player
    p.tid = dp.tid;
    if (g.phase === PHASE.FANTASY_DRAFT) {
        const fakeP = helpers.deepCopy(p);
        fakeP.draft = {
            round: dp.round,
            pick: dp.pick,
            tid: dp.tid,
            year: g.season,
            originalTid: dp.originalTid,
            pot: p.ratings[p.ratings.length - 1].pot,
            ovr: p.ratings[p.ratings.length - 1].ovr,
            skills: p.ratings[p.ratings.length - 1].skills,
        };
        local.fantasyDraftResults.push(fakeP);
    } else {
        p.draft = {
            round: dp.round,
            pick: dp.pick,
            tid: dp.tid,
            year: g.season,
            originalTid: dp.originalTid,
            pot: p.ratings[0].pot,
            ovr: p.ratings[0].ovr,
            skills: p.ratings[0].skills,
        };
    }

    // Contract
    if (g.phase !== PHASE.FANTASY_DRAFT) {
        if (g.hardCap) {
            // Make it an expiring contract, so player immediately becomes a free agent
            player.setContract(
                p,
                {
                    amount: g.minContract,
                    exp: g.season,
                },
                true,
            );
        } else {
            const rookieSalaries = getRookieSalaries();
            const i = dp.pick - 1 + g.numTeams * (dp.round - 1);
            const years = 4 - dp.round; // 2 years for 2nd round, 3 years for 1st round;
            player.setContract(
                p,
                {
                    amount: rookieSalaries[i],
                    exp: g.season + years,
                },
                true,
            );
        }
    }

    // Add stats row if necessary (fantasy draft in ongoing season)
    if (g.phase === PHASE.FANTASY_DRAFT && g.nextPhase <= PHASE.PLAYOFFS) {
        player.addStatsRow(p, g.nextPhase === PHASE.PLAYOFFS);
    }

    await idb.cache.players.put(p);
    await idb.cache.draftPicks.delete(dp.dpid);

    const draftName =
        g.phase === PHASE.FANTASY_DRAFT
            ? `${g.season} fantasy draft`
            : `${g.season} draft`;
    logEvent({
        type: "draft",
        text: `The <a href="${helpers.leagueUrl([
            "roster",
            g.teamAbbrevsCache[dp.tid],
            g.season,
        ])}">${
            g.teamNamesCache[dp.tid]
        }</a> selected <a href="${helpers.leagueUrl(["player", p.pid])}">${
            p.firstName
        } ${p.lastName}</a> with the ${helpers.ordinal(
            dp.pick + (dp.round - 1) * g.numTeams,
        )} pick in the <a href="${helpers.leagueUrl([
            "draft_summary",
            g.season,
        ])}">${draftName}</a>.`,
        showNotification: false,
        pids: [p.pid],
        tids: [p.tid],
    });

    if (g.userTids.includes(dp.tid)) {
        if (!overrides.core.team.rosterAutoSort) {
            throw new Error("Missing overrides.core.team.rosterAutoSort");
        }
        await overrides.core.team.rosterAutoSort(dp.tid, true);
    }
};

export default selectPlayer;
