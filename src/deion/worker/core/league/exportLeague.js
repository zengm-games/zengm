// @flow

import { getAll, idb } from "../../db";
import { g, local } from "../../util";

/**
 * Export existing active league.
 *
 * @memberOf core.league
 * @param {string[]} stores Array of names of objectStores to include in export
 * @return {Promise} Resolve to all the exported league data.
 */
const exportLeague = async (stores: string[]) => {
    // Always flush before export, so export is current!
    await idb.cache.flush();

    const exportedLeague: any = {
        version: idb.league.version,
    };

    // Row from leagueStore in meta db.
    // phaseText is needed if a phase is set in gameAttributes.
    // name is only used for the file name of the exported roster file.
    exportedLeague.meta = { phaseText: local.phaseText, name: g.leagueName };

    await Promise.all(
        stores.map(async store => {
            exportedLeague[store] = await getAll(idb.league[store]);
        }),
    );

    if (stores.includes("teams")) {
        for (let i = 0; i < exportedLeague.teamSeasons.length; i++) {
            const tid = exportedLeague.teamSeasons[i].tid;
            for (let j = 0; j < exportedLeague.teams.length; j++) {
                if (exportedLeague.teams[j].tid === tid) {
                    if (!exportedLeague.teams[j].hasOwnProperty("seasons")) {
                        exportedLeague.teams[j].seasons = [];
                    }
                    exportedLeague.teams[j].seasons.push(
                        exportedLeague.teamSeasons[i],
                    );
                    break;
                }
            }
        }

        for (let i = 0; i < exportedLeague.teamStats.length; i++) {
            const tid = exportedLeague.teamStats[i].tid;
            for (let j = 0; j < exportedLeague.teams.length; j++) {
                if (exportedLeague.teams[j].tid === tid) {
                    if (!exportedLeague.teams[j].hasOwnProperty("stats")) {
                        exportedLeague.teams[j].stats = [];
                    }
                    exportedLeague.teams[j].stats.push(
                        exportedLeague.teamStats[i],
                    );
                    break;
                }
            }
        }

        delete exportedLeague.teamSeasons;
        delete exportedLeague.teamStats;
    }

    if (stores.includes("gameAttributes")) {
        // Remove cached variables, since they will be auto-generated on re-import but are confusing if someone edits the JSON
        const keysToDelete = [
            "teamAbbrevsCache",
            "teamNamesCache",
            "teamRegionsCache",
        ];
        exportedLeague.gameAttributes = exportedLeague.gameAttributes.filter(
            gameAttribute => !keysToDelete.includes(gameAttribute.key),
        );
    } else {
        // Set startingSeason if gameAttributes is not selected, otherwise it's going to fail loading unless startingSeason is coincidentally the same as the default
        exportedLeague.startingSeason = g.startingSeason;
    }

    return exportedLeague;
};

export default exportLeague;
