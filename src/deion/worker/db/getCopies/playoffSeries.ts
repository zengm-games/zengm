import { idb } from "..";
import { mergeByPk } from "./helpers";
import { PlayoffSeries } from "../../../common/types";

const getCopies = async (): Promise<PlayoffSeries[]> => {
	return mergeByPk(
		await idb.league.getAll("playoffSeries"),
		await idb.cache.playoffSeries.getAll(),
		idb.cache.storeInfos.playoffSeries.pk,
	);
};

export default getCopies;
