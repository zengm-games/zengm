// @flow

import backboard from "backboard";
import { connectLeague, idb } from "../db";
import type { GetOutput } from "../../common/types";

async function updateDeleteLeague({
    lid,
}: GetOutput): void | { [key: string]: any } {
    if (typeof lid !== "number") {
        throw new Error("Invalid input for lid");
    }

    const db = await connectLeague(lid);
    try {
        const [numGames, numPlayers, teamSeasons, l] = await Promise.all([
            db.games.count(),
            db.players.count(),
            db.teamSeasons
                .index("tid, season")
                .getAll(backboard.bound([0], [0, ""])),
            idb.meta.leagues.get(lid),
        ]);

        return {
            lid,
            name: l.name,
            numGames,
            numPlayers,
            numSeasons: teamSeasons.length,
        };
    } catch (err) {
        return {
            lid,
            name: undefined,
            numGames: undefined,
            numPlayers: undefined,
            numSeasons: undefined,
        };
    }
}

export default {
    runBefore: [updateDeleteLeague],
};
