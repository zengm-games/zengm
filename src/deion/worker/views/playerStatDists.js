// @flow

import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

async function updatePlayers(
    inputs: { season: number },
    updateEvents: UpdateEvents,
    state: any,
): void | { [key: string]: any } {
    if (
        (inputs.season === g.season &&
            (updateEvents.includes("gameSim") ||
                updateEvents.includes("playerMovement"))) ||
        inputs.season !== state.season
    ) {
        let players;
        if (g.season === inputs.season && g.phase <= PHASE.PLAYOFFS) {
            players = await idb.cache.players.indexGetAll("playersByTid", [
                PLAYER.FREE_AGENT,
                Infinity,
            ]);
        } else {
            players = await idb.getCopies.players({
                activeSeason: inputs.season,
            });
        }
        players = await idb.getCopies.playersPlus(players, {
            ratings: ["skills"],
            stats: [
                "gp",
                "gs",
                "min",
                "fg",
                "fga",
                "fgp",
                "tp",
                "tpa",
                "tpp",
                "ft",
                "fta",
                "ftp",
                "orb",
                "drb",
                "trb",
                "ast",
                "tov",
                "stl",
                "blk",
                "pf",
                "pts",
                "per",
            ],
            season: inputs.season,
        });

        const statsAll = players.reduce((memo, p) => {
            for (const stat of Object.keys(p.stats)) {
                if (stat === "playoffs") {
                    continue;
                }

                if (memo.hasOwnProperty(stat)) {
                    memo[stat].push(p.stats[stat]);
                } else {
                    memo[stat] = [p.stats[stat]];
                }
            }
            return memo;
        }, {});

        return {
            numGames: g.numGames,
            season: inputs.season,
            statsAll,
        };
    }
}

export default {
    runBefore: [updatePlayers],
};
