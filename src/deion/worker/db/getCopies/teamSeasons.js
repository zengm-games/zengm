// @flow

import backboard from "backboard";
import { idb } from "..";
import { mergeByPk } from "./helpers";
import { g, helpers } from "../../util";
import type { TeamSeason } from "../../../common/types";

const getCopies = async ({
    tid,
    season,
    seasons,
}: { tid?: number, season?: number, seasons?: [number, number] } = {}): Promise<
    TeamSeason[],
> => {
    if (tid === undefined) {
        if (season !== undefined) {
            if (season >= g.season - 2) {
                // Single season, from cache
                return helpers.deepCopy(
                    await idb.cache.teamSeasons.indexGetAll(
                        "teamSeasonsBySeasonTid",
                        [[season], [season, "Z"]],
                    ),
                );
            }
            // Single season, from database
            return idb.league.teamSeasons
                .index("season, tid")
                .getAll(backboard.bound([season], [season, ""]));
        }

        throw new Error(
            "idb.getCopies.teamSeasons requires season if tid is undefined",
        );
    }

    if (seasons !== undefined) {
        return mergeByPk(
            await idb.league.teamSeasons
                .index("tid, season")
                .getAll(backboard.bound([tid, seasons[0]], [tid, seasons[1]])),
            await idb.cache.teamSeasons.indexGetAll("teamSeasonsByTidSeason", [
                [tid, seasons[0]],
                [tid, seasons[1]],
            ]),
            idb.cache.storeInfos.teamSeasons.pk,
        );
    }

    return mergeByPk(
        await idb.league.teamSeasons
            .index("tid, season")
            .getAll(backboard.bound([tid], [tid, ""])),
        await idb.cache.teamSeasons.indexGetAll("teamSeasonsByTidSeason", [
            [tid],
            [tid, "Z"],
        ]),
        idb.cache.storeInfos.teamSeasons.pk,
    );
};

export default getCopies;
