import { getAll, idb } from "../index.ts";
import { mergeByPk } from "./helpers.ts";
import type { Game, GetCopyType } from "../../../common/types.ts";
import { helpers } from "../../util/index.ts";

const getCopies = async (
	{
		gid,
		note,
		season,
	}: {
		gid?: number;
		note?: boolean;
		season?: number;
	} = {},
	type?: GetCopyType,
): Promise<Game[]> => {
	if (season !== undefined) {
		return mergeByPk(
			await getAll(
				idb.league.transaction("games").store.index("season"),
				season,
			),
			(await idb.cache.games.getAll()).filter((gm) => {
				return gm.season === season;
			}),
			"games",
			type,
		);
	}

	if (gid !== undefined) {
		const game = await idb.cache.games.get(gid);
		if (game) {
			return [type === "noCopyCache" ? game : helpers.deepCopy(game)];
		}

		const game2 = await idb.league.get("games", gid);
		if (game2) {
			return [game2];
		}

		return [];
	}

	if (note) {
		return mergeByPk(
			await idb.league
				.transaction("games")
				.store.index("noteBool")
				// undefined for key returns all of the players with noteBool, since the ones without noteBool are not included in this index
				.getAll(),
			await idb.cache.games.getAll(),
			"games",
			type,
		).filter((row) => row.noteBool === 1);
	}

	return mergeByPk(
		await getAll(idb.league.transaction("games").store),
		await idb.cache.games.getAll(),
		"games",
		type,
	);
};

export default getCopies;
