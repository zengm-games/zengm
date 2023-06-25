import orderBy from "lodash-es/orderBy";
import { idb } from "..";
import { mergeByPk } from "./helpers";
import type { PlayerHistoricRatings, GetCopyType } from "../../../common/types";

const getCopies = async (
	{
		pid,
	}: {
		pid?: number;
	} = {},
	type?: GetCopyType,
): Promise<PlayerHistoricRatings[]> => {
	let playerRatings;
	if (pid !== undefined) {
		playerRatings = [];
	}
	playerRatings = mergeByPk(
		await idb.league
			.transaction("playerHistoricRatings")
			.store.index("pid")
			.getAll(),
		(await idb.cache.playerHistoricRatings.getAll()).filter(playerRatings => {
			return playerRatings.pid === pid;
		}),
		"playerHistoricRatings",
		type,
	);

	return orderBy(playerRatings, ["pid", "srId"]);
};

export default getCopies;
