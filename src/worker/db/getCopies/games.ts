import { getAll, idb } from "..";
import { mergeByPk } from "./helpers";
import type { Game, GetCopyType } from "../../../common/types";

const getCopies = async (
	{
		season,
	}: {
		season?: number;
	} = {},
	type?: GetCopyType,
): Promise<Game[]> => {
	if (season !== undefined) {
		return mergeByPk(
			await idb.league
				.transaction("games")
				.store.index("season")
				.getAll(season),
			(await idb.cache.games.getAll()).filter(gm => {
				return gm.season === season;
			}),
			"games",
			type,
		);
	}

	return mergeByPk(
		await getAll(idb.league.transaction("games").store),
		await idb.cache.games.getAll(),
		"games",
		type,
	);
};

export default getCopies;
