// @flow

import { PLAYER } from "../../../common";
import { g, helpers, logEvent, overrides } from "../../util";
import type { Conditions, Player } from "../../../common/types";

/**
 * Have a player retire, including all event and HOF bookkeeping.
 *
 * This just updates a player object. You need to write it to the database after.
 *
 * @memberOf core.player
 * @param {IDBTransaction} ot An IndexedDB transaction on events.
 * @param {Object} p Player object.
 * @return {Object} p Updated (retired) player object.
 */
function retire(
    p: Player<>,
    conditions?: Conditions,
    retiredNotification?: boolean = true,
) {
    if (conditions && retiredNotification) {
        logEvent(
            {
                type: "retired",
                text: `<a href="${helpers.leagueUrl(["player", p.pid])}">${
                    p.firstName
                } ${p.lastName}</a> retired.`,
                showNotification: p.tid === g.userTid,
                pids: [p.pid],
                tids: [p.tid],
            },
            conditions,
        );
    }

    p.tid = PLAYER.RETIRED;
    p.retiredYear = g.season;

    // Add to Hall of Fame?
    if (!overrides.core.player.madeHof) {
        throw new Error("Missing overrides.core.player.madeHof");
    }
    if (conditions && overrides.core.player.madeHof(p)) {
        p.hof = true;
        p.awards.push({
            season: g.season,
            type: "Inducted into the Hall of Fame",
        });
        logEvent(
            {
                type: "hallOfFame",
                text: `<a href="${helpers.leagueUrl(["player", p.pid])}">${
                    p.firstName
                } ${
                    p.lastName
                }</a> was inducted into the <a href="${helpers.leagueUrl([
                    "hall_of_fame",
                ])}">Hall of Fame</a>.`,
                showNotification: p.statsTids.includes(g.userTid),
                pids: [p.pid],
                tids: p.statsTids,
            },
            conditions,
        );
    }
}

export default retire;
