// @flow

import { allStar } from "../core";
import { idb } from "../db";
import { g } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

const stats =
    process.env.SPORT === "basketball" ? ["pts", "trb", "ast"] : ["keyStats"];

const getPlayerInfo = async (pid: number) => {
    const p = await idb.cache.players.get(pid);
    return idb.getCopy.playersPlus(p, {
        attrs: ["pid", "name", "tid", "abbrev", "injury", "watch", "age"],
        ratings: ["ovr", "skills", "pos"],
        season: g.season,
        stats,
        fuzz: true,
    });
};

const augment = async allStars => {
    const remaining = await Promise.all(
        allStars.remaining.map(({ pid }) => getPlayerInfo(pid)),
    );
    const teams = await Promise.all(
        allStars.teams.map(players =>
            Promise.all(players.map(({ pid }) => getPlayerInfo(pid))),
        ),
    );

    return {
        finalized: allStars.finalized,
        remaining,
        teams,
        teamNames: allStars.teamNames,
    };
};

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

        const { finalized, teams, teamNames, remaining } = await augment(
            allStars,
        );

        return {
            finalized,
            remaining,
            stats,
            teams,
            teamNames,
            userTids: g.userTids,
        };
    }
};

export default {
    runBefore: [updateAllStars],
};
