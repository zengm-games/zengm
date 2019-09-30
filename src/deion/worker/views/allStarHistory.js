// @flow

import { idb } from "../db";
import { g } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

const getPlayer = async ({ pid, tid }: { pid: number, tid: number }) => {
    const p = await idb.cache.players.get(pid);
    if (p) {
        return {
            abbrev: g.teamAbbrevsCache[tid],
            pid,
            name: `${p.firstName} ${p.lastName}`,
            tid,
        };
    }
};

const augment = allAllStars => {
    return Promise.all(
        allAllStars.map(async row => {
            return {
                gid: row.gid,
                mvp: row.mvp ? await getPlayer(row.mvp) : undefined,
                overtimes: row.overtimes,
                score: row.score,
                season: row.season,
                teamNames: row.teamNames,
                captain1: await getPlayer(row.teams[0][0]),
                captain2: await getPlayer(row.teams[1][0]),
            };
        }),
    );
};

const updateAllStarHistory = async (
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } => {
    if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
        const allAllStars = await idb.getCopies.allStars();
        console.log(allAllStars);

        return {
            allAllStars: await augment(allAllStars),
            userTid: g.userTid,
        };
    }
};

export default {
    runBefore: [updateAllStarHistory],
};
