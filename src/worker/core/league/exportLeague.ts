import { gameAttributesArrayToObject } from "../../../common";
import { getAll, idb } from "../../db";
import { g, local } from "../../util";
import { gameAttributesCache } from "../../util/defaultGameAttributes";
import getName from "./getName";

/* Export existing active league.
 *
 * @memberOf core.league
 * @param {string[]} stores Array of names of objectStores to include in export
 * @return {Promise} Resolve to all the exported league data.
 */
const exportLeague = async (
	stores: string[],
	{
		meta = true,
		filter = {},
		forEach = {},
		map = {},
	}: {
		meta?: boolean;
		filter?: {
			[key: string]: (a: any) => boolean;
		};
		forEach?: {
			[key: string]: (a: any) => void;
		};
		map?: {
			[key: string]: (a: any) => any;
		};
	},
) => {
	// Always flush before export, so export is current!
	await idb.cache.flush();
	const exportedLeague: any = {
		version: idb.league.version,
	};

	// Row from leagueStore in meta db.
	// phaseText is needed if a phase is set in gameAttributes.
	// name is only used for the file name of the exported roster file.
	if (meta) {
		const leagueName = await getName();
		exportedLeague.meta = {
			phaseText: local.phaseText,
			name: leagueName,
		};
	}

	await Promise.all(
		stores.map(async store => {
			exportedLeague[store] = await getAll(
				idb.league.transaction(store as any).store,
				undefined,
				filter[store],
			);

			if (forEach[store]) {
				for (const row of exportedLeague[store]) {
					forEach[store](row);
				}
			}

			if (map[store]) {
				exportedLeague[store] = exportedLeague[store].map(map[store]);
			}
		}),
	);

	if (stores.includes("players")) {
		// Don't export cartoon face if imgURL is provided
		exportedLeague.players = exportedLeague.players.map((p: any) => {
			if (p.imgURL && p.imgURL !== "") {
				const p2 = { ...p };
				delete p2.face;
				return p2;
			}

			return p;
		});
	}

	if (stores.includes("teams")) {
		if (exportedLeague.teamSeasons) {
			for (let i = 0; i < exportedLeague.teamSeasons.length; i++) {
				const tid = exportedLeague.teamSeasons[i].tid;

				for (let j = 0; j < exportedLeague.teams.length; j++) {
					if (exportedLeague.teams[j].tid === tid) {
						if (!exportedLeague.teams[j].hasOwnProperty("seasons")) {
							exportedLeague.teams[j].seasons = [];
						}

						exportedLeague.teams[j].seasons.push(exportedLeague.teamSeasons[i]);
						break;
					}
				}
			}
			delete exportedLeague.teamSeasons;
		}

		if (exportedLeague.teamStats) {
			for (let i = 0; i < exportedLeague.teamStats.length; i++) {
				const tid = exportedLeague.teamStats[i].tid;

				for (let j = 0; j < exportedLeague.teams.length; j++) {
					if (exportedLeague.teams[j].tid === tid) {
						if (!exportedLeague.teams[j].hasOwnProperty("stats")) {
							exportedLeague.teams[j].stats = [];
						}

						exportedLeague.teams[j].stats.push(exportedLeague.teamStats[i]);
						break;
					}
				}
			}
			delete exportedLeague.teamStats;
		}
	}

	if (exportedLeague.gameAttributes) {
		// Remove cached variables, since they will be auto-generated on re-import but are confusing if someone edits the JSON
		const gaArray = exportedLeague.gameAttributes.filter(
			(gameAttribute: any) => !gameAttributesCache.includes(gameAttribute.key),
		);
		exportedLeague.gameAttributes = gameAttributesArrayToObject(gaArray);
	} else {
		// Set startingSeason if gameAttributes is not selected, otherwise it's going to fail loading unless startingSeason is coincidentally the same as the default
		exportedLeague.startingSeason = g.get("startingSeason");
	}

	// No need emitting empty object stores
	for (const key of Object.keys(exportedLeague)) {
		if (
			Array.isArray(exportedLeague[key]) &&
			exportedLeague[key].length === 0
		) {
			delete exportedLeague[key];
		}
	}

	return exportedLeague;
};

export default exportLeague;
