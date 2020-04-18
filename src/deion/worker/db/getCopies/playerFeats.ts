import { getAll, idb } from "..";
import { mergeByPk } from "./helpers";
import type { PlayerFeat } from "../../../common/types";

const getCopies = async (): Promise<PlayerFeat[]> => {
	return mergeByPk(
		await getAll(idb.league.transaction("playerFeats").store),
		await idb.cache.playerFeats.getAll(),
		idb.cache.storeInfos.playerFeats.pk,
	);
};

export default getCopies;
