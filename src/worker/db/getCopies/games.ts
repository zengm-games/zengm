import { getAll, idb } from "..";
import { mergeByPk } from "./helpers";
import type { Game } from "../../../common/types";

const getCopies = async ({
	season,
}: {
	season?: number;
} = {}): Promise<Game[]> => {
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
		);
	}

	return mergeByPk(
		await getAll(idb.league.transaction("games").store),
		await idb.cache.games.getAll(),
		"games",
	);
};

export default getCopies;
