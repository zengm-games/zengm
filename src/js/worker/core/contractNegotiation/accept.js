// @flow

import { PHASE } from "../../../common";
import { player, team } from "..";
import cancel from "./cancel";
import { idb } from "../../db";
import { g, helpers, logEvent } from "../../util";

/**
 * Accept the player's offer.
 *
 * If successful, then the team's current roster will be displayed.
 *
 * @memberOf core.contractNegotiation
 * @param {number} pid An integer that must correspond with the player ID of a player in an ongoing negotiation.
 * @return {Promise.<string=>} If an error occurs, resolves to a string error message.
 */
const accept = async (
    pid: number,
    amount: number,
    exp: number,
): Promise<?string> => {
    const negotiation = await idb.cache.negotiations.get(pid);
    if (!negotiation) {
        return `No negotiation with player ${pid} found.`;
    }

    const payroll = await team.getPayroll(g.userTid);

    // If this contract brings team over the salary cap (minus a fudge factor), it's not a minimum;
    // contract, and it's not re-signing a current player, ERROR!
    if (
        !negotiation.resigning &&
        (payroll + amount - 1 > g.salaryCap && amount > g.minContract)
    ) {
        return "This contract would put you over the salary cap. You cannot go over the salary cap to sign free agents to contracts higher than the minimum salary. Either negotiate for a lower contract or cancel the negotiation.";
    }

    // This error is for sanity checking in multi team mode. Need to check for existence of negotiation.tid because it wasn't there originally and I didn't write upgrade code. Can safely get rid of it later.
    if (negotiation.tid !== undefined && negotiation.tid !== g.userTid) {
        return `This negotiation was started by the ${
            g.teamRegionsCache[negotiation.tid]
        } ${g.teamNamesCache[negotiation.tid]} but you are the ${
            g.teamRegionsCache[g.userTid]
        } ${
            g.teamNamesCache[g.userTid]
        }. Either switch teams or cancel this negotiation.`;
    }

    const p = await idb.cache.players.get(pid);
    p.tid = g.userTid;
    p.gamesUntilTradable = 14;

    // Handle stats if the season is in progress
    if (g.phase <= PHASE.PLAYOFFS) {
        // Otherwise, not needed until next season
        player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
    }

    player.setContract(
        p,
        {
            amount,
            exp,
        },
        true,
    );

    // No conditions needed here because showNotification is false
    if (negotiation.resigning) {
        logEvent({
            type: "reSigned",
            text: `The <a href="${helpers.leagueUrl([
                "roster",
                g.teamAbbrevsCache[g.userTid],
                g.season,
            ])}">${
                g.teamNamesCache[g.userTid]
            }</a> re-signed <a href="${helpers.leagueUrl(["player", p.pid])}">${
                p.firstName
            } ${p.lastName}</a> for ${helpers.formatCurrency(
                p.contract.amount / 1000,
                "M",
            )}/year through ${p.contract.exp}.`,
            showNotification: false,
            pids: [p.pid],
            tids: [g.userTid],
        });
    } else {
        logEvent({
            type: "freeAgent",
            text: `The <a href="${helpers.leagueUrl([
                "roster",
                g.teamAbbrevsCache[g.userTid],
                g.season,
            ])}">${
                g.teamNamesCache[g.userTid]
            }</a> signed <a href="${helpers.leagueUrl(["player", p.pid])}">${
                p.firstName
            } ${p.lastName}</a> for ${helpers.formatCurrency(
                p.contract.amount / 1000,
                "M",
            )}/year through ${p.contract.exp}.`,
            showNotification: false,
            pids: [p.pid],
            tids: [g.userTid],
        });
    }

    await idb.cache.players.put(p);

    await cancel(pid);
};

export default accept;
