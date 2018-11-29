// @flow

import { PHASE } from "../../../common";
import { idb } from "../../db";
import { g, helpers, logEvent, overrides } from "../../util";
import type {
    Conditions,
    GamePlayer,
    GameResults,
} from "../../../common/types";

const checkStatisticalFeat = (
    pid: number,
    tid: number,
    p: GamePlayer,
    results: GameResults,
    conditions: Conditions,
) => {
    const logFeat = text => {
        logEvent(
            {
                type: "playerFeat",
                text,
                showNotification: tid === g.userTid,
                pids: [pid],
                tids: [tid],
            },
            conditions,
        );
    };

    if (!overrides.core.player.checkStatisticalFeat) {
        throw new Error("Missing overrides.core.player.checkStatisticalFeat");
    }
    const feat = overrides.core.player.checkStatisticalFeat(p);

    if (feat) {
        const [i, j] = results.team[0].id === tid ? [0, 1] : [1, 0];
        const won = results.team[i].stat.pts > results.team[j].stat.pts;
        const featTextArr = Object.keys(feat).map(
            stat => `${feat[stat]} ${stat}`,
        );

        let featText = `<a href="${helpers.leagueUrl(["player", pid])}">${
            p.name
        }</a> had <a href="${helpers.leagueUrl([
            "game_log",
            g.teamAbbrevsCache[tid],
            g.season,
            results.gid,
        ])}">`;
        for (let k = 0; k < featTextArr.length; k++) {
            if (featTextArr.length > 1 && k === featTextArr.length - 1) {
                featText += " and ";
            }

            featText += featTextArr[k];

            if (featTextArr.length > 2 && k < featTextArr.length - 2) {
                featText += ", ";
            }
        }
        featText += `</a> in ${
            results.team[i].stat.pts.toString().charAt(0) === "8" ? "an" : "a"
        } ${results.team[i].stat.pts}-${results.team[j].stat.pts} ${
            won ? "win over the" : "loss to the"
        } ${g.teamNamesCache[results.team[j].id]}.`;

        logFeat(featText);

        idb.cache.playerFeats.add({
            pid,
            name: p.name,
            pos: p.pos,
            season: g.season,
            tid,
            oppTid: results.team[j].id,
            playoffs: g.phase === PHASE.PLAYOFFS,
            gid: results.gid,
            stats: p.stat,
            won,
            score: `${results.team[i].stat.pts}-${results.team[j].stat.pts}`,
            overtimes: results.overtimes,
        });
    }
};

export default checkStatisticalFeat;
