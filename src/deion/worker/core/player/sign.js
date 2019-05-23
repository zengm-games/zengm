// @flow

import { PHASE } from "../../../common";
import addStatsRow from "./addStatsRow";
import setContract from "./setContract";
import { g, helpers, logEvent } from "../../util";
import type { Phase, Player, PlayerContract } from "../../../common/types";

const sign = (
    p: Player<>,
    tid: number,
    contract: PlayerContract,
    phase: Phase,
) => {
    p.tid = tid;
    p.gamesUntilTradable = Math.round(0.17 * g.numGames); // 14 for basketball, 3 for football

    // Handle stats if the season is in progress
    if (phase <= PHASE.PLAYOFFS) {
        // Otherwise, not needed until next season
        addStatsRow(p, phase === PHASE.PLAYOFFS);
    }

    setContract(p, contract, true);

    const resigning =
        phase === PHASE.RESIGN_PLAYERS && p.draft.year !== g.season;
    const eventType = resigning ? "reSigned" : "freeAgent";
    const signedOrReSigned = resigning ? "re-signed" : "signed";

    logEvent({
        type: eventType,
        text: `The <a href="${helpers.leagueUrl([
            "roster",
            g.teamAbbrevsCache[p.tid],
            g.season,
        ])}">${
            g.teamNamesCache[p.tid]
        }</a> ${signedOrReSigned} <a href="${helpers.leagueUrl([
            "player",
            p.pid,
        ])}">${p.firstName} ${p.lastName}</a> for ${helpers.formatCurrency(
            p.contract.amount / 1000,
            "M",
        )}/year through ${p.contract.exp}.`,
        showNotification: false,
        pids: [p.pid],
        tids: [p.tid],
    });
};

export default sign;
