import { getAll, idb } from "../index.ts";
import { mergeByPk } from "./helpers.ts";
import type { GetCopyType, PlayerFeat } from "../../../common/types.ts";

const getCopies = async (
	options: any = {},
	type?: GetCopyType,
): Promise<PlayerFeat[]> => {
	return mergeByPk(
		await getAll(idb.league.transaction("playerFeats").store),
		await idb.cache.playerFeats.getAll(),
		"playerFeats",
		type,
	);
};

export default getCopies;
