// @flow

import { allStar } from "../core";
import { idb } from "../db";
import { g } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

console.log("fuck");
const updateAllStars = async (
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | { [key: string]: any } => {
    console.log("updateEvents", updateEvents);
    if (
        updateEvents.includes("firstRun") ||
        updateEvents.includes("gameSim") ||
        updateEvents.includes("playerMovement")
    ) {
        const nextGameIsAllStar = await allStar.nextGameIsAllStar();
        if (!nextGameIsAllStar) {
            return {
                errorMessage:
                    "You can only view this page right before the All-Star Game.",
            };
        }

        let allStars = await idb.cache.allStars.get(g.season);

        if (true || !allStars) {
            const conditions = undefined;
            allStars = await allStar.create(false, conditions);
            await idb.cache.allStars.put(allStars);
        }
        console.log("allStars", allStars);

        return {
            allStars,
        };
    }
};

export default {
    runBefore: [updateAllStars],
};
