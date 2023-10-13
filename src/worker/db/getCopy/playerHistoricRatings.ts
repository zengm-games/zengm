import { idb } from "..";
import type { PlayerHistoricRatings, GetCopyType } from "../../../common/types";

const getCopy = async (
	{ pid, season }: { pid: number; season: number },
	type?: GetCopyType,
): Promise<PlayerHistoricRatings | void> => {
	const result = await idb.getCopies.playerHistoricRatings({
		pid,
	});
	if (result.length > 0 && pid == 2816) {
		console.log("bitch");
		console.log(result);
	}

	return result.filter(pr => String(pr.season) == String(season))[0];
};

export default getCopy;
