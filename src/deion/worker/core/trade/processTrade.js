// @flow

import { PHASE } from "../../../common";
import { player } from "..";
import { idb } from "../../db";
import { g, helpers, logEvent, toUI, updatePlayMenu } from "../../util";
import type { TradeSummary } from "../../../common/types";

const formatAssetsEventLog = t => {
    const strings = [];

    t.trade.forEach(p =>
        strings.push(
            `<a href="${helpers.leagueUrl(["player", p.pid])}">${p.name}</a>`,
        ),
    );
    t.picks.forEach(dp => strings.push(`a ${dp.desc}`));

    let text;
    if (strings.length === 0) {
        text = "nothing";
    } else if (strings.length === 1) {
        text = strings[0];
    } else if (strings.length === 2) {
        text = `${strings[0]} and ${strings[1]}`;
    } else {
        text = strings[0];
        for (let i = 1; i < strings.length; i++) {
            if (i === strings.length - 1) {
                text += `, and ${strings[i]}`;
            } else {
                text += `, ${strings[i]}`;
            }
        }
    }

    return text;
};

const processTrade = async (
    tradeSummary: TradeSummary,
    tids: [number, number],
    pids: [number[], number[]],
    dpids: [number[], number[]],
) => {
    for (const j of [0, 1]) {
        const k = j === 0 ? 1 : 0;

        for (const pid of pids[j]) {
            const p = await idb.cache.players.get(pid);
            p.tid = tids[k];
            // p.gamesUntilTradable = 14; // Don't make traded players untradable
            p.ptModifier = 1; // Reset
            if (g.phase <= PHASE.PLAYOFFS) {
                player.addStatsRow(p, g.phase === PHASE.PLAYOFFS);
            }
            await idb.cache.players.put(p);
        }

        for (const dpid of dpids[j]) {
            const dp = await idb.cache.draftPicks.get(dpid);
            dp.tid = tids[k];
            await idb.cache.draftPicks.put(dp);
        }
    }

    await toUI(["realtimeUpdate", ["playerMovement"]]);

    // If draft pick was changed...
    if (g.phase === PHASE.DRAFT) {
        await updatePlayMenu();
    }

    logEvent({
        type: "trade",
        text: `The <a href="${helpers.leagueUrl([
            "roster",
            g.teamAbbrevsCache[tids[0]],
            g.season,
        ])}">${g.teamNamesCache[tids[0]]}</a> traded ${formatAssetsEventLog(
            tradeSummary.teams[0],
        )} to the <a href="${helpers.leagueUrl([
            "roster",
            g.teamAbbrevsCache[tids[1]],
            g.season,
        ])}">${g.teamNamesCache[tids[1]]}</a> for ${formatAssetsEventLog(
            tradeSummary.teams[1],
        )}.`,
        showNotification: false,
        pids: pids[0].concat(pids[1]),
        tids: Array.from(tids), // Array.from is for Flow
    });
};

export default processTrade;
