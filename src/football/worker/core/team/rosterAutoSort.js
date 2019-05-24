// @flow

import { idb } from "../../../../deion/worker/db";
import { g } from "../../../../deion/worker/util";
import { POSITIONS } from "../../../common/constants";
import type { Position } from "../../../common/types";

const score = (p, pos) => {
    let tempScore = p.ratings.ovrs[pos];
    if (p.ratings.pos === pos) {
        tempScore += 5;
    }
    return tempScore;
};

const rosterAutoSort = async (
    tid: number,
    onlyNewPlayers?: boolean,
    pos?: Position,
) => {
    const t = await idb.cache.teams.get(tid);
    const depth = t.depth;
    if (depth === undefined) {
        throw new Error("Missing depth");
    }

    const playersFromCache = await idb.cache.players.indexGetAll(
        "playersByTid",
        tid,
    );
    const players = await idb.getCopies.playersPlus(playersFromCache, {
        attrs: ["pid"],
        ratings: ["pos", "ovrs"],
        season: g.season,
        showNoStats: true,
        showRookies: true,
        fuzz: true,
    });

    const positions = pos ? [pos] : POSITIONS;

    for (const pos2 of positions) {
        if (onlyNewPlayers) {
            // Identify players not currently in the depth chart, and add them to the depth chart above any player worse
            // than them without otherwise disturbing the order of the depth chart. This is useful for adding free agents to
            // the user's team - start them if they're better, but otherwise don't fuck with the user's depth chart.

            const playersNotInDepth = players.filter(
                p => !depth[pos2].includes(p.pid),
            );

            for (const p of playersNotInDepth) {
                const pScore = score(p, pos2);
                let added = false;

                for (let i = 0; i < depth[pos2].length; i++) {
                    const p2 = players.find(p3 => p3.pid === depth[pos2][i]);
                    if (!p2 || pScore > score(p2, pos2)) {
                        depth[pos2].splice(i, 0, p.pid);
                        added = true;
                        break;
                    }
                }

                if (!added) {
                    depth[pos2].push(p.pid);
                    added = true;
                }
            }
        } else {
            // Sort everything from scratch
            players.sort((a, b) => score(b, pos2) - score(a, pos2));
            depth[pos2] = players.map(p => p.pid);
        }
    }

    await idb.cache.teams.put(t);
};

export default rosterAutoSort;
