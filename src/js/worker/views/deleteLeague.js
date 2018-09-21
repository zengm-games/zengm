// @flow

import backboard from "backboard";
import { connectLeague, idb } from "../db";
import type { GetOutput } from "../../common/types";

async function updateDeleteLeague({
    lid,
}: GetOutput): void | { [key: string]: any } {
    if (typeof lid !== "number" || Number.isNaN(lid)) {
        return {
            errorMessage: "Invalid league ID.",
        };
    }

    try {
        const db = await connectLeague(lid);
        const [numPlayers, numSeasons, l] = await Promise.all([
            db.players.count(),
            db.teamSeasons
                .index("tid, season")
                .count(backboard.bound([0], [0, ""])),
            idb.meta.leagues.get(lid),
        ]);

        return {
            lid,
            name: l.name,
            numPlayers,
            numSeasons,
        };
    } catch (err) {
        return {
            lid,
            name: undefined,
            numPlayers: undefined,
            numSeasons: undefined,
        };
    }
}

export default {
    runBefore: [updateDeleteLeague],
};
