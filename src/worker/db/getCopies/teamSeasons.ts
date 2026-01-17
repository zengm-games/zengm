import { idb } from "../index.ts";
import { maybeDeepCopy, mergeByPk } from "./helpers.ts";
import { g } from "../../util/index.ts";
import type { GetCopyType, TeamSeason } from "../../../common/types.ts";
import { NUM_PRIOR_SEASONS_TEAM_SEASONS } from "../Cache.ts";

const getCopies = async (
	{
		tid,
		season,
		seasons,
		note,
	}: {
		tid?: number;
		season?: number;
		seasons?: [number, number];
		note?: boolean;
	} = {},
	type?: GetCopyType,
): Promise<TeamSeason[]> => {
	if (note) {
		return mergeByPk(
			await idb.league
				.transaction("teamSeasons")
				.store.index("noteBool")
				// undefined for key returns all of the players with noteBool, since the ones without noteBool are not included in this index
				.getAll(),
			await idb.cache.teamSeasons.getAll(),
			"teamSeasons",
			type,
		).filter((row) => row.noteBool === 1);
	}

	if (tid !== undefined && season !== undefined) {
		// Return array of length 1
		let teamSeason;
		if (season >= g.get("season") - NUM_PRIOR_SEASONS_TEAM_SEASONS) {
			teamSeason = maybeDeepCopy(
				await idb.cache.teamSeasons.indexGet("teamSeasonsBySeasonTid", [
					season,
					tid,
				]),
				type,
			);
		} else {
			teamSeason = await idb.league
				.transaction("teamSeasons")
				.store.index("season, tid")
				.get([season, tid]);
		}

		if (teamSeason) {
			return [teamSeason];
		}
		return [];
	}

	if (tid === undefined) {
		if (season !== undefined) {
			if (season >= g.get("season") - NUM_PRIOR_SEASONS_TEAM_SEASONS) {
				// Single season, from cache
				return maybeDeepCopy(
					await idb.cache.teamSeasons.indexGetAll("teamSeasonsBySeasonTid", [
						[season],
						[season, "Z"],
					]),
					type,
				);
			}

			// Single season, from database
			return idb.league
				.transaction("teamSeasons")
				.store.index("season, tid")
				.getAll(IDBKeyRange.bound([season], [season, ""]));
		}

		throw new Error(
			"idb.getCopies.teamSeasons requires season if tid is undefined",
		);
	}

	if (seasons !== undefined) {
		return mergeByPk(
			await idb.league
				.transaction("teamSeasons")
				.store.index("tid, season")
				.getAll(IDBKeyRange.bound([tid, seasons[0]], [tid, seasons[1]])),
			await idb.cache.teamSeasons.indexGetAll("teamSeasonsByTidSeason", [
				[tid, seasons[0]],
				[tid, seasons[1]],
			]),
			"teamSeasons",
			type,
		);
	}

	return mergeByPk(
		await idb.league
			.transaction("teamSeasons")
			.store.index("tid, season")
			.getAll(IDBKeyRange.bound([tid], [tid, ""])),
		await idb.cache.teamSeasons.indexGetAll("teamSeasonsByTidSeason", [
			[tid],
			[tid, "Z"],
		]),
		"teamSeasons",
		type,
	);
};

export default getCopies;
