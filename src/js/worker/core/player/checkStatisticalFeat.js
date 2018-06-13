// @flow

import { PHASE } from "../../../common";
import { idb } from "../../db";
import { g, helpers, logEvent } from "../../util";
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
    const minFactor = Math.sqrt(g.quarterLength / 12); // sqrt is to account for fatigue in short/long games. Also https://news.ycombinator.com/item?id=11032596
    const TEN = minFactor * 10;
    const FIVE = minFactor * 5;
    const TWENTY = minFactor * 20;
    const TWENTY_FIVE = minFactor * 25;
    const FIFTY = minFactor * 50;

    let saveFeat = false;

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

    let doubles = ["pts", "ast", "stl", "blk"].reduce((count, stat) => {
        if (p.stat[stat] >= TEN) {
            return count + 1;
        }
        return count;
    }, 0);
    if (p.stat.orb + p.stat.drb >= TEN) {
        doubles += 1;
    }

    const statArr = {};
    if (
        p.stat.pts >= FIVE &&
        p.stat.ast >= FIVE &&
        p.stat.stl >= FIVE &&
        p.stat.blk >= FIVE &&
        p.stat.orb + p.stat.drb >= FIVE
    ) {
        statArr.points = p.stat.pts;
        statArr.rebounds = p.stat.orb + p.stat.drb;
        statArr.assists = p.stat.ast;
        statArr.steals = p.stat.stl;
        statArr.blocks = p.stat.blk;
        saveFeat = true;
    }
    if (doubles >= 3) {
        if (p.stat.pts >= TEN) {
            statArr.points = p.stat.pts;
        }
        if (p.stat.orb + p.stat.drb >= TEN) {
            statArr.rebounds = p.stat.orb + p.stat.drb;
        }
        if (p.stat.ast >= TEN) {
            statArr.assists = p.stat.ast;
        }
        if (p.stat.stl >= TEN) {
            statArr.steals = p.stat.stl;
        }
        if (p.stat.blk >= TEN) {
            statArr.blocks = p.stat.blk;
        }
        saveFeat = true;
    }
    if (p.stat.pts >= FIFTY) {
        statArr.points = p.stat.pts;
        saveFeat = true;
    }
    if (p.stat.orb + p.stat.drb >= TWENTY_FIVE) {
        statArr.rebounds = p.stat.orb + p.stat.drb;
        saveFeat = true;
    }
    if (p.stat.ast >= TWENTY) {
        statArr.assists = p.stat.ast;
        saveFeat = true;
    }
    if (p.stat.stl >= TEN) {
        statArr.steals = p.stat.stl;
        saveFeat = true;
    }
    if (p.stat.blk >= TEN) {
        statArr.blocks = p.stat.blk;
        saveFeat = true;
    }
    if (p.stat.tp >= TEN) {
        statArr["three pointers"] = p.stat.tp;
        saveFeat = true;
    }

    if (saveFeat) {
        const [i, j] = results.team[0].id === tid ? [0, 1] : [1, 0];
        const won = results.team[i].stat.pts > results.team[j].stat.pts;
        const featTextArr = Object.keys(statArr).map(
            stat => `${statArr[stat]} ${stat}`,
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
