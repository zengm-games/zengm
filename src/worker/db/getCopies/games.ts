import { getAll, idb } from "..";
import { mergeByPk } from "./helpers";
import type { Game, GetCopyType } from "../../../common/types";
import { helpers } from "../../util";

const getCopies = async (
	{
		gid,
		season,
	}: {
		gid?: number;
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

	return mergeByPk(
		await getAll(idb.league.transaction("games").store),
		await idb.cache.games.getAll(),
		"games",
		type,
	);
};

export default getCopies;
