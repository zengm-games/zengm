import { idb } from "..";
import { maybeDeepCopy, mergeByPk } from "./helpers";
import { g } from "../../util";
import type { GetCopyType, TeamSeason } from "../../../common/types";

const getCopies = async (
	{
		tid,
		season,
		seasons,
	}: {
		tid?: number;
		season?: number;
		seasons?: [number, number];
	} = {},
	type?: GetCopyType,
): Promise<TeamSeason[]> => {
	if (tid !== undefined && season !== undefined) {
		// Return array of length 1
		let teamSeason;
		if (season >= g.get("season") - 2) {
			teamSeason = maybeDeepCopy(
				await idb.cache.teamSeasons.indexGet("teamSeasonsBySeasonTid", [
					season,
					tid,
				]),
				type,
			);
		}

		if (!teamSeason) {
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
			if (season >= g.get("season") - 2) {
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
