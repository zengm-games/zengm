import { getAll, idb } from "..";
import { mergeByPk } from "./helpers";
import type { PlayerFeat } from "../../../common/types";

const getCopies = async (): Promise<PlayerFeat[]> => {
	return mergeByPk(
		await getAll(idb.league.transaction("playerFeats").store),
		await idb.cache.playerFeats.getAll(),
		"playerFeats",
	);
};

export default getCopies;
